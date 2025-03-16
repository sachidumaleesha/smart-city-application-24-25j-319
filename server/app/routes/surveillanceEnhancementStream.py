import os
import time
import tensorflow as tf
import cv2
import numpy as np
from flask import Blueprint, Response, jsonify, send_from_directory

cctv_bp = Blueprint("cctv", __name__)

# Load the trained model from a relative path
model_path = os.path.join(os.path.dirname(__file__), "..", "dbModels", "surveillance_enhancement_v6.h5")
model = tf.keras.models.load_model(model_path, compile=False)

IMAGE_SIZE = (128, 128)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Cannot open the webcam.")

# Global variables to count suspicious detections and save snapshot reports
suspicious_count = 0
snapshotsReports = []  # Each element will be a dict: {timestamp, image_url}

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

@cctv_bp.route("/cctv/suspicious", methods=["GET"])
def get_suspicious_count():
    global suspicious_count
    return jsonify({"suspicious_count": suspicious_count})

@cctv_bp.route("/cctv/reset", methods=["POST"])
def reset_suspicious_count():
    global suspicious_count
    suspicious_count = 0
    return jsonify({"message": "Suspicious count reset"}), 200

# Snapshot endpoint: capture a frame, save it, and record the snapshot report.
@cctv_bp.route("/cctv/snapshot", methods=["GET"])
def snapshot():
    ret, frame = cap.read()
    if not ret:
        return jsonify({"error": "Failed to capture snapshot"}), 500

    snapshots_dir = os.path.join(os.path.dirname(__file__), "..", "snapshots")
    os.makedirs(snapshots_dir, exist_ok=True)
    filename = f"snapshot_{int(time.time())}.jpg"
    filepath = os.path.join(snapshots_dir, filename)
    cv2.imwrite(filepath, frame)
    
    # Construct URL for the snapshot; adjust if needed for your host/port.
    image_url = f"http://localhost:5000/snapshots/{filename}"
    
    # Save the snapshot record (timestamp in ISO format)
    snapshot_record = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "image_url": image_url,
    }
    snapshotsReports.append(snapshot_record)
    
    return jsonify({"image_url": image_url})

# New endpoint: return all snapshot reports.
@cctv_bp.route("/cctv/reports", methods=["GET"])
def get_reports():
    return jsonify({"reports": snapshotsReports})

@cctv_bp.route("/cctv/start", methods=["POST"])
def start_feed():
    global cap, suspicious_count
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"message": "Error: Cannot open the webcam."}), 500
    suspicious_count = 0
    return jsonify({"message": "Camera feed started"}), 200

@cctv_bp.route("/cctv/stop", methods=["POST"])
def stop_feed():
    global cap
    if cap and cap.isOpened():
        cap.release()
        cv2.destroyAllWindows()
    return jsonify({"message": "Camera feed stopped"}), 200

@cctv_bp.route("/snapshots/<path:filename>")
def download_file(filename):
    snapshots_dir = os.path.join(os.path.dirname(__file__), "..", "snapshots")
    return send_from_directory(snapshots_dir, filename)