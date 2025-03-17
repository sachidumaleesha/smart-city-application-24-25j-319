from flask import Blueprint, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
import base64
import time
import os
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
    "AIzaSyC-Sf8hb56fUEA6dz-LoI7V9lGL24nqpTw",
    "AIzaSyA8zb9JMTEMTfpxGS8TSK3oiHQVSu0iLqU",
    "AIzaSyDnFCpD3Fa1AWWSQCt1xRaT5hfJqegZqEY",
    "AIzaSyCmpDX9A8wB_rPy9QCWF6buTMTzqnB9FB0",
    "AIzaSyA5Xrlqpw-ZMhrX59gz0WdR66P_VlkSmC0",
    "AIzaSyCs-IM6fKh_mJQRxvcwlrbnA1dIQk9miMI",
    "AIzaSyBPWX1jQVLSfwQQTyVX51ElB2nLBNxkFGU",
    "AIzaSyB77nTSFaIoYkPZ74wYczGgEx3XS0-ujFs"
]

def configure_gemini_random_key():
    """Randomly selects and configures Gemini API"""
    selected_key = random.choice(GEMINI_API_KEYS)
    genai.configure(api_key=selected_key)
    print(f"🔑 Gemini key selected: {selected_key[-5:]}")

# ✅ Camera Configurations
CAMERAS = {
    "Kaduwela": 0,
    "Malabe": 1,
    "Welivita": 2,
    "Pittugala": 3
}

# ✅ Hyperparameters
DETECTION_HISTORY_SIZE = 5                # Reduced for faster reaction
REQUIRED_POSITIVE_DETECTIONS = 3          # Confirm accident with fewer positives
PREDICTION_THRESHOLD = 0.60               # Lower threshold to trigger more easily
COOLDOWN_PERIOD_SEC = 5    

# ✅ Shared alerts list
accident_alerts = []


def preprocess_frame(frame, img_height=250, img_width=250):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (img_width, img_height))
    frame_normalized = frame_resized / 255.0
    return np.expand_dims(frame_normalized, axis=0)


def predict_accident_with_smoothing(camera_name, frame, state):
    preprocessed = preprocess_frame(frame)
    prediction = model.predict(preprocessed)[0][0]
    # print(f"⚠️ TensorFlow accident prediction score at {camera_name}: {prediction:.2f}")

    is_accident = prediction > PREDICTION_THRESHOLD

    state["history"].append(is_accident)
    if len(state["history"]) > DETECTION_HISTORY_SIZE:
        state["history"].pop(0)

    confirmed_accident = state["history"].count(True) >= REQUIRED_POSITIVE_DETECTIONS

    current_time = time.time()
    time_since_last_alert = current_time - state["last_alert_time"]

    if confirmed_accident and time_since_last_alert >= COOLDOWN_PERIOD_SEC:
        state["last_alert_time"] = current_time
        return True

    return False


def verify_with_gemini(frame):
    try:
        configure_gemini_random_key()  # Select random API key

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(frame_rgb)

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
        print(f"🔹 Raw Response: {result_text}")

        is_accident = '"accident"' in result_text.lower() or "'accident'" in result_text.lower()

        return is_accident, result_text

    except Exception as e:
        print(f"❌ Ai verification error: {str(e)}")
        return False, None


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


def generate_frames(camera_name, camera_index):
    cap = open_camera_with_retry(camera_index)

    if cap is None:
        return

    frame_count = 0
    camera_state = {
        "history": [],
        "last_alert_time": 0
    }

    while True:
        success, frame = cap.read()
        if not success:
            time.sleep(1)
            continue

        frame_count += 1

        if frame_count % 10 == 0:
            detected = predict_accident_with_smoothing(camera_name, frame, camera_state)

            if detected:
                is_gemini_accident, gemini_response = verify_with_gemini(frame)

                if is_gemini_accident:
                    _, buffer = cv2.imencode(".jpg", frame)
                    frame_base64 = base64.b64encode(buffer).decode("utf-8")

                    # ✅ Add to alerts (Frontend can handle WhatsApp alerts!)
                    accident_alerts.append({
                        "camera": camera_name,
                        "frame": frame_base64,
                        "gemini_result": gemini_response  # Pass response to frontend
                    })

            label = "ACCIDENT DETECTED!" if detected else "No Accident"
            color = (0, 0, 255) if detected else (0, 255, 0)

            cv2.putText(frame, label, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)

        _, jpeg = cv2.imencode(".jpg", frame)
        frame_bytes = jpeg.tobytes()

        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

    cap.release()


@accident_bp.route("/stream/<camera_name>")
def stream_camera(camera_name):
    if camera_name not in CAMERAS:
        return jsonify({"error": f"Camera '{camera_name}' not found"}), 404

    return Response(
        generate_frames(camera_name, CAMERAS[camera_name]),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@accident_bp.route("/alerts", methods=["GET"])
def get_accident_alerts():
    global accident_alerts

    if not isinstance(accident_alerts, list):
        accident_alerts = []

    if not accident_alerts:
        return jsonify({"alerts": []})

    latest_alerts = accident_alerts.copy()
    accident_alerts = []
    return jsonify({"alerts": latest_alerts})
