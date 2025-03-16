# from flask import Blueprint, jsonify

# accident_bp = Blueprint("accidentDetection", __name__)

# @accident_bp.route("/accident-1", methods=["GET"])
# def test1():
#     return jsonify({"message": "Login successful"})

# @accident_bp.route("/accident-2", methods=["POST"])
# def test2():
#     return jsonify({"message": "User registered successfully"})

# from flask import Blueprint, Response, jsonify
# import cv2
# import numpy as np
# import tensorflow as tf
# import threading
# import base64

# accident_bp = Blueprint("accidentDetection", __name__)

# # Load trained accident detection model
# MODEL_PATH = "app/mlModels/modelNew.h5"
# model = tf.keras.models.load_model(MODEL_PATH)

# # List of cameras (Update with actual webcam indexes)
# CAMERAS = {
#     "Kaduwela": 0,  # First webcam
#     "Malabe": 1,  # Second webcam
#     "Welivita": 2,  # Third webcam
#     "SLIIT": 3   # Fourth webcam
# }

# # Shared accident alerts
# accident_alerts = []

# def preprocess_frame(frame, img_height=250, img_width=250):
#     """Preprocess the frame for prediction."""
#     frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     frame_resized = cv2.resize(frame_rgb, (img_width, img_height))
#     frame_normalized = frame_resized / 255.0
#     return np.expand_dims(frame_normalized, axis=0)

# def predict_accident(frame):
#     """Predict accident in the given frame."""
#     preprocessed = preprocess_frame(frame)
#     prediction = model.predict(preprocessed)
#     return prediction[0][0] > 0.7  # True if accident detected, else False

# def generate_frames(camera_name, camera_index):
#     """Capture and analyze frames from a webcam."""
#     cap = cv2.VideoCapture(camera_index)
#     if not cap.isOpened():
#         print(f"❌ Error: Cannot connect to {camera_name}")
#         return

#     frame_count = 0

#     while True:
#         success, frame = cap.read()
#         if not success:
#             break

#         frame_count += 1

#         # Analyze every 10th frame
#         if frame_count % 10 == 0:
#             accident_detected = predict_accident(frame)
            
#             if accident_detected:
#                 _, buffer = cv2.imencode(".jpg", frame)
#                 frame_base64 = base64.b64encode(buffer).decode("utf-8")
#                 accident_alerts.append({"camera": camera_name, "frame": frame_base64})

#             # Overlay result on frame
#             text = "ACCIDENT DETECTED!" if accident_detected else "No Accident"
#             color = (0, 0, 255) if accident_detected else (0, 255, 0)
#             cv2.putText(frame, text, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

#         # Encode frame as JPEG
#         _, buffer = cv2.imencode(".jpg", frame)
#         frame_bytes = buffer.tobytes()

#         # Yield frame in streaming format
#         yield (b"--frame\r\n"
#                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

# @accident_bp.route("/stream/<camera_name>")
# def stream_camera(camera_name):
#     """Stream real-time feed from a specified camera."""
#     if camera_name not in CAMERAS:
#         return jsonify({"error": "Camera not found"}), 404
#     return Response(generate_frames(camera_name, CAMERAS[camera_name]), mimetype="multipart/x-mixed-replace; boundary=frame")

# @accident_bp.route("/alerts", methods=["GET"])
# def get_accident_alerts():
#     """Fetch the latest accident alerts."""
#     global accident_alerts

#     if not isinstance(accident_alerts, list):  # Ensure it's a list
#         accident_alerts = []

#     if not accident_alerts:
#         return jsonify({"alerts": []})  # Return empty list instead of crashing

#     latest_alerts = accident_alerts.copy()
#     accident_alerts = []  # Clear alerts after sending

#     return jsonify({"alerts": latest_alerts})
from flask import Blueprint, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
import base64
import time

accident_bp = Blueprint("accidentDetection", __name__)

# ✅ Load trained accident detection model
MODEL_PATH = "app/mlModels/modelNew.h5"
model = tf.keras.models.load_model(MODEL_PATH)

# ✅ Camera configurations (adjust indexes if necessary)
CAMERAS = {
    "Kaduwela": 0,
    "Malabe": 1,
    "Welivita": 2,
    "SLIIT": 3
}

# ✅ Shared alerts across cameras
accident_alerts = []

# ✅ Hyperparameters for detection smoothing
DETECTION_HISTORY_SIZE = 7
REQUIRED_POSITIVE_DETECTIONS = 5
PREDICTION_THRESHOLD = 0.90
COOLDOWN_PERIOD_SEC = 3

# ✅ Preprocess frame
def preprocess_frame(frame, img_height=250, img_width=250):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (img_width, img_height))
    frame_normalized = frame_resized / 255.0
    return np.expand_dims(frame_normalized, axis=0)

# ✅ Predict accident with smoothing and cooldown control
def predict_accident_with_smoothing(camera_name, frame, state):
    preprocessed = preprocess_frame(frame)
    prediction = model.predict(preprocessed)[0][0]
    is_accident = prediction > PREDICTION_THRESHOLD

    state["history"].append(is_accident)
    if len(state["history"]) > DETECTION_HISTORY_SIZE:
        state["history"].pop(0)

    confirmed_accident = state["history"].count(True) >= REQUIRED_POSITIVE_DETECTIONS

    current_time = time.time()
    time_since_last_alert = current_time - state["last_alert_time"]

    if confirmed_accident and time_since_last_alert >= COOLDOWN_PERIOD_SEC:
        print(f"🚨 Accident detected on {camera_name}!")
        state["last_alert_time"] = current_time
        return True

    return False

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

# ✅ Stream frames
def generate_frames(camera_name, camera_index):
    cap = open_camera_with_retry(camera_index)

    if cap is None:
        return  # No valid camera found, stop generator

    print(f"🎥 Streaming from {camera_name} (Camera {camera_index})...")

    frame_count = 0
    camera_state = {
        "history": [],
        "last_alert_time": 0
    }

    while True:
        success, frame = cap.read()

        if not success:
            # print(f"❌ Frame capture failed from {camera_name}. Retrying...")
            time.sleep(1)
            continue

        frame_count += 1

        # ✅ Analyze every 10th frame
        if frame_count % 10 == 0:
            detected = predict_accident_with_smoothing(camera_name, frame, camera_state)

            if detected:
                _, buffer = cv2.imencode(".jpg", frame)
                frame_base64 = base64.b64encode(buffer).decode("utf-8")
                accident_alerts.append({
                    "camera": camera_name,
                    "frame": frame_base64
                })

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

# ✅ Get accident alerts
@accident_bp.route("/alerts", methods=["GET"])
def get_accident_alerts():
    global accident_alerts

    if not isinstance(accident_alerts, list):
        accident_alerts = []

    if not accident_alerts:
        return jsonify({"alerts": []})

    latest_alerts = accident_alerts.copy()
    accident_alerts = []

    print(f"🚀 Sending {len(latest_alerts)} alerts to frontend...")
    return jsonify({"alerts": latest_alerts})

