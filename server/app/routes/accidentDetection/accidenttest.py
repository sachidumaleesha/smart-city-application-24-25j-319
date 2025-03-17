from flask import Blueprint, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
import base64
import time
import threading
import os
import queue
from PIL import Image
import google.generativeai as genai
import random

accident_bp = Blueprint("accidentDetection", __name__)

# ✅ TensorFlow model loading
MODEL_PATH = "app/mlModels/modelNew.h5"
model = tf.keras.models.load_model(MODEL_PATH)

# ✅ Gemini API Keys Array
GEMINI_API_KEYS = [
    "AIzaSyBNcxhkgmj0zpX8HbkkXWe6-FLHoVXpsG4",
    "AIzaSyAeHm3GEPbEUYigXAf1p9gfO2mQrbDlycQ",
    # ... add more if needed
]

# ✅ Configure Gemini Key Randomly
def configure_gemini_random_key():
    selected_key = random.choice(GEMINI_API_KEYS)
    genai.configure(api_key=selected_key)
    print(f"🔑 Gemini key selected: {selected_key[-5:]}")

# ✅ Camera configurations
CAMERAS = {
    "Kaduwela": 0,
    "Malabe": 1,
    "Welivita": 2,
    "Pittugala": 3
}

# ✅ Shared structures
accident_alerts = []
alerts_lock = threading.Lock()
frame_queue = queue.Queue(maxsize=20)  # FIFO queue for frames (First Out Last In managed manually)

# ✅ Folder to save frames
FRAME_SAVE_PATH = "detected_frames"
os.makedirs(FRAME_SAVE_PATH, exist_ok=True)

# ✅ Hyperparameters for detection smoothing
DETECTION_HISTORY_SIZE = 7
REQUIRED_POSITIVE_DETECTIONS = 5
PREDICTION_THRESHOLD = 0.90
COOLDOWN_PERIOD_SEC = 3


# ✅ Preprocess frame for TensorFlow
def preprocess_frame(frame, img_height=250, img_width=250):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (img_width, img_height))
    frame_normalized = frame_resized / 255.0
    return np.expand_dims(frame_normalized, axis=0)


# ✅ Predict accident with smoothing
def predict_accident_with_smoothing(camera_name, frame, state):
    preprocessed = preprocess_frame(frame)
    prediction = model.predict(preprocessed, verbose=0)[0][0]
    is_accident = prediction > PREDICTION_THRESHOLD

    state["history"].append(is_accident)
    if len(state["history"]) > DETECTION_HISTORY_SIZE:
        state["history"].pop(0)

    confirmed_accident = state["history"].count(True) >= REQUIRED_POSITIVE_DETECTIONS

    current_time = time.time()
    time_since_last_alert = current_time - state["last_alert_time"]

    if confirmed_accident and time_since_last_alert >= COOLDOWN_PERIOD_SEC:
        print(f"🚨 Accident detected by TensorFlow on {camera_name}")
        state["last_alert_time"] = current_time
        return True

    return False


# ✅ Save frame locally and manage old files
def save_detected_frame(camera_name, frame):
    timestamp = int(time.time() * 1000)
    filename = f"{camera_name}_{timestamp}.jpg"
    filepath = os.path.join(FRAME_SAVE_PATH, filename)

    cv2.imwrite(filepath, frame)
    print(f"💾 Saved frame {filename}")

    # ✅ Add to processing queue
    frame_queue.put(filepath)

    # ✅ Manage local folder: keep only latest N files
    files = sorted(os.listdir(FRAME_SAVE_PATH))
    if len(files) > 20:
        oldest_file = files[0]
        os.remove(os.path.join(FRAME_SAVE_PATH, oldest_file))
        print(f"🗑️ Deleted old frame {oldest_file}")


# ✅ Open and validate video capture with retries
def open_camera_with_retry(camera_index, retries=3, delay=2):
    for attempt in range(retries):
        cap = cv2.VideoCapture(camera_index)

        if cap.isOpened():
            print(f"✅ Camera {camera_index} opened successfully!")
            return cap
        else:
            print(f"⚠️ Failed to open camera {camera_index}. Retrying ({attempt + 1}/{retries})...")
            cap.release()
            time.sleep(delay)

    print(f"❌ Unable to open camera {camera_index} after {retries} retries.")
    return None


# ✅ Stream frames (TensorFlow detection only)
def generate_frames(camera_name, camera_index):
    cap = open_camera_with_retry(camera_index)

    if cap is None:
        return

    print(f"🎥 Streaming from {camera_name} (Camera {camera_index})...")

    frame_count = 0
    camera_state = {
        "history": [],
        "last_alert_time": 0
    }

    while True:
        success, frame = cap.read()

        if not success:
            print(f"⚠️ Frame read failed from {camera_name}")
            time.sleep(1)
            continue

        frame_count += 1

        # ✅ Analyze every 10th frame
        if frame_count % 10 == 0:
            detected = predict_accident_with_smoothing(camera_name, frame, camera_state)

            if detected:
                # Save locally and push to queue (parallel verification)
                save_detected_frame(camera_name, frame)

            label = "ACCIDENT DETECTED!" if detected else "No Accident"
            color = (0, 0, 255) if detected else (0, 255, 0)

            cv2.putText(frame, label, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)

        # ✅ Encode and yield frame as byte stream
        _, jpeg = cv2.imencode(".jpg", frame)
        frame_bytes = jpeg.tobytes()

        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

    cap.release()
    print(f"🛑 Released camera {camera_index} connection for {camera_name}")


# ✅ Gemini verification process (runs independently)
def gemini_worker():
    while True:
        try:
            if frame_queue.empty():
                time.sleep(1)
                continue

            # Get the first frame in (FIFO)
            filepath = frame_queue.get()

            if not os.path.exists(filepath):
                continue

            configure_gemini_random_key()

            with Image.open(filepath) as pil_image:
                gemini_model = genai.GenerativeModel("gemini-1.5-pro")

                response = gemini_model.generate_content(
                    [
                        "I will provide an image and your task is to identify whether that image is an accident or non-accident image. Give me output as JSON format. Ex {class: accident}",
                        pil_image
                    ],
                    generation_config={
                        "temperature": 0.2,
                        "max_output_tokens": 100
                    }
                )

                result_text = response.text
                print(f"✅ Gemini verified result: {result_text}")

                # ✅ Only alert if confirmed
                if '"accident"' in result_text.lower() or "'accident'" in result_text.lower():
                    with open(filepath, "rb") as img_file:
                        frame_base64 = base64.b64encode(img_file.read()).decode("utf-8")

                    with alerts_lock:
                        accident_alerts.append({
                            "camera": filepath.split('_')[0],  # extract camera from filename
                            "frame": frame_base64,
                            "gemini_result": result_text
                        })
                        print(f"🚀 Gemini verified alert added for frontend")

            # ✅ Delete frame after processing
            os.remove(filepath)
            print(f"🗑️ Deleted verified frame {filepath}")

        except Exception as e:
            print(f"❌ Gemini worker error: {str(e)}")
            time.sleep(1)


# ✅ Start Gemini verification worker in background thread
worker_thread = threading.Thread(target=gemini_worker, daemon=True)
worker_thread.start()


# ✅ Stream route for frontend cameras
@accident_bp.route("/stream/<camera_name>")
def stream_camera(camera_name):
    if camera_name not in CAMERAS:
        return jsonify({"error": f"Camera '{camera_name}' not found"}), 404

    camera_index = CAMERAS[camera_name]

    return Response(
        generate_frames(camera_name, camera_index),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


# ✅ Get accident alerts (returns Gemini verified alerts)
@accident_bp.route("/alerts", methods=["GET"])
def get_accident_alerts():
    global accident_alerts

    with alerts_lock:
        if not accident_alerts:
            return jsonify({"alerts": []})

        latest_alerts = accident_alerts.copy()
        accident_alerts.clear()

    print(f"🚀 Sending {len(latest_alerts)} Gemini verified alerts to frontend...")
    return jsonify({"alerts": latest_alerts})
