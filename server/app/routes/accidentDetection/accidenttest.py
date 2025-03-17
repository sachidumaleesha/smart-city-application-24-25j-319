from flask import Blueprint, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
import base64
import time
import threading
import os
from PIL import Image
import google.generativeai as genai
import random
import queue

accident_bp = Blueprint("accidentDetection", __name__)

# ✅ Load TensorFlow model
MODEL_PATH = "app/mlModels/modelNew.h5"
model = tf.keras.models.load_model(MODEL_PATH)

# ✅ Gemini API Keys Array
GEMINI_API_KEYS = [
    "AIzaSyBNcxhkgmj0zpX8HbkkXWe6-FLHoVXpsG4",
    "AIzaSyAeHm3GEPbEUYigXAf1p9gfO2mQrbDlycQ"
]

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

# ✅ Globals
accident_alerts = []
alerts_lock = threading.Lock()
frame_queue = queue.Queue(maxsize=50)

FRAME_SAVE_PATH = "detected_frames"
os.makedirs(FRAME_SAVE_PATH, exist_ok=True)

# ✅ Hyperparameters
DETECTION_HISTORY_SIZE = 5
REQUIRED_POSITIVE_DETECTIONS = 3
PREDICTION_THRESHOLD = 0.60
COOLDOWN_PERIOD_SEC = 5


# ✅ TensorFlow Frame Preprocess
def preprocess_frame(frame, img_height=250, img_width=250):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (img_width, img_height))
    frame_normalized = frame_resized / 255.0
    return np.expand_dims(frame_normalized, axis=0)


# ✅ Background Detection Worker
def detection_worker(camera_name, frame):
    try:
        camera_state = {
            "history": [],
            "last_alert_time": 0
        }

        preprocessed = preprocess_frame(frame)
        prediction = model.predict(preprocessed, verbose=0)[0][0]
        is_accident = prediction > PREDICTION_THRESHOLD

        camera_state["history"].append(is_accident)
        if len(camera_state["history"]) > DETECTION_HISTORY_SIZE:
            camera_state["history"].pop(0)

        confirmed_accident = camera_state["history"].count(True) >= REQUIRED_POSITIVE_DETECTIONS
        time_since_last_alert = time.time() - camera_state["last_alert_time"]

        if confirmed_accident and time_since_last_alert >= COOLDOWN_PERIOD_SEC:
            camera_state["last_alert_time"] = time.time()

            timestamp = int(time.time() * 1000)
            filename = f"{camera_name}_{timestamp}.jpg"
            filepath = os.path.join(FRAME_SAVE_PATH, filename)
            cv2.imwrite(filepath, frame)

            frame_queue.put(filepath)
            print(f"🚨 TensorFlow detected accident at {camera_name}. Frame saved.")

    except Exception as e:
        print(f"❌ Detection worker error: {e}")


# ✅ Gemini Verification Worker
def gemini_worker():
    while True:
        try:
            if frame_queue.empty():
                time.sleep(1)
                continue

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
                print(f"✅ Gemini verified: {result_text}")

                if '"accident"' in result_text.lower() or "'accident'" in result_text.lower():
                    with open(filepath, "rb") as img_file:
                        frame_base64 = base64.b64encode(img_file.read()).decode("utf-8")

                    with alerts_lock:
                        accident_alerts.append({
                            "camera": filepath.split('_')[0],
                            "frame": frame_base64,
                            "gemini_result": result_text
                        })

            os.remove(filepath)
            print(f"🗑️ Deleted frame after Gemini verification: {filepath}")

        except Exception as e:
            print(f"❌ Gemini worker error: {e}")
            time.sleep(1)


# ✅ Camera Stream Generator (Just for Streaming, Not Blocking!)
def generate_frames(camera_name, camera_index):
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        print(f"❌ Camera {camera_index} failed to open")
        return

    print(f"🎥 Streaming camera {camera_name}...")

    frame_count = 0
    while True:
        success, frame = cap.read()

        if not success:
            print(f"⚠️ Frame read failed from {camera_name}")
            time.sleep(1)
            continue

        frame_count += 1

        # ✅ Send a frame for detection every 10 frames, in parallel
        if frame_count % 10 == 0:
            threading.Thread(target=detection_worker, args=(camera_name, frame.copy()), daemon=True).start()

        # ✅ Overlay (just for UI feedback)
        label = "LIVE STREAM"
        color = (0, 255, 0)
        cv2.putText(frame, label, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)

        _, jpeg = cv2.imencode(".jpg", frame)
        frame_bytes = jpeg.tobytes()

        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

    cap.release()


# ✅ Start Gemini Worker Thread
worker_thread = threading.Thread(target=gemini_worker, daemon=True)
worker_thread.start()


# ✅ Flask Route - Stream Cameras
@accident_bp.route("/stream/<camera_name>")
def stream_camera(camera_name):
    if camera_name not in CAMERAS:
        return jsonify({"error": f"Camera '{camera_name}' not found"}), 404

    return Response(
        generate_frames(camera_name, CAMERAS[camera_name]),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


# ✅ Flask Route - Get Verified Alerts
@accident_bp.route("/alerts", methods=["GET"])
def get_accident_alerts():
    global accident_alerts
    with alerts_lock:
        if not accident_alerts:
            return jsonify({"alerts": []})

        latest_alerts = accident_alerts.copy()
        accident_alerts.clear()

    print(f"🚀 Returning {len(latest_alerts)} alerts to frontend")
    return jsonify({"alerts": latest_alerts})
