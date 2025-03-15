import os
import time
import tensorflow as tf
import cv2
import numpy as np
from flask import Blueprint, Response, jsonify

cctv_bp = Blueprint("cctv", __name__)

# Load the trained model (if needed for overlay, etc.)
model = tf.keras.models.load_model(
    r"C:\Users\nipun\Downloads\surveillance_enhancement_v6.h5", compile=False
)

IMAGE_SIZE = (128, 128)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Cannot open the webcam.")

# Global variable to count suspicious detections
suspicious_count = 0

def gen_frames():
    global suspicious_count
    frame_skip = 2  # Process every 2nd frame if desired
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_skip == 0:
            # Run model inference and overlay prediction text:
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            resized = tf.image.resize(img, IMAGE_SIZE)
            scaled = resized / 255.0
            input_image = np.expand_dims(scaled.numpy(), axis=0)
            prediction = model.predict(input_image)[0][0]
            if prediction > 0.8:
                label = "Normal Activity"
                color = (0, 255, 0)
            else:
                label = "Suspicious Activity Detected!"
                color = (0, 0, 255)
                suspicious_count += 1  # Increment suspicious detection
            cv2.putText(frame, label, (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2, cv2.LINE_AA)

        ret2, buffer = cv2.imencode('.jpg', frame)
        if not ret2:
            continue
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        frame_count += 1

@cctv_bp.route("/cctv/video_feed")
def video_feed():
    return Response(gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

# New endpoint to retrieve the suspicious count
@cctv_bp.route("/cctv/suspicious", methods=["GET"])
def get_suspicious_count():
    global suspicious_count
    return jsonify({"suspicious_count": suspicious_count})


# New endpoint to reset the suspicious count to 0
@cctv_bp.route("/cctv/reset", methods=["POST"])
def reset_suspicious_count():
    global suspicious_count
    suspicious_count = 0
    return jsonify({"message": "Suspicious count reset"}), 200

@cctv_bp.route("/cctv/start", methods=["POST"])
def start_feed():
    global cap, suspicious_count
    cap = cv2.VideoCapture(0)  # Reinitialize the camera
    if not cap.isOpened():
        return jsonify({"message": "Error: Cannot open the webcam."}), 500
    suspicious_count = 0  # Optionally reset the suspicious count
    return jsonify({"message": "Camera feed started"}), 200


@cctv_bp.route("/cctv/stop", methods=["POST"])
def stop_feed():
    global cap
    if cap and cap.isOpened():
        cap.release()  # Release the camera
        cv2.destroyAllWindows()  # (Optional) Close any OpenCV windows
    return jsonify({"message": "Camera feed stopped"}), 200