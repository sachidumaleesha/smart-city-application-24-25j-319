import os
import time
import tensorflow as tf
import cv2
import numpy as np
from flask import Blueprint, Response, jsonify, send_from_directory, current_app, request
from flask_cors import cross_origin

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
@cross_origin()
def video_feed():
    return Response(gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

@cctv_bp.route("/cctv/suspicious", methods=["GET", "OPTIONS"])
@cross_origin()
def get_suspicious_count():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    global suspicious_count
    response = jsonify({"suspicious_count": suspicious_count})
    return response

@cctv_bp.route("/cctv/reset", methods=["POST", "OPTIONS"])
@cross_origin()
def reset_suspicious_count():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    global suspicious_count
    suspicious_count = 0
    return jsonify({"message": "Suspicious count reset"}), 200

@cctv_bp.route("/cctv/snapshot", methods=["GET", "OPTIONS"])
@cross_origin()
def snapshot():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    ret, frame = cap.read()
    if not ret:
        return jsonify({"error": "Failed to capture snapshot"}), 500

    snapshots_dir = os.path.join(os.path.dirname(__file__), "..", "snapshots")
    os.makedirs(snapshots_dir, exist_ok=True)
    filename = f"snapshot_{int(time.time())}.jpg"
    filepath = os.path.join(snapshots_dir, filename)
    cv2.imwrite(filepath, frame)
    
    # Construct URL for the snapshot using the server's URL
    image_url = f"http://13.201.219.73:5000/snapshots/{filename}"
    
    # Save the snapshot record (timestamp in ISO format)
    snapshot_record = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "image_url": image_url,
    }
    snapshotsReports.append(snapshot_record)
    
    return jsonify({"image_url": image_url})

@cctv_bp.route("/cctv/reports", methods=["GET", "OPTIONS"])
@cross_origin()
def get_reports():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    return jsonify({"reports": snapshotsReports})

@cctv_bp.route("/cctv/start", methods=["POST", "OPTIONS"])
@cross_origin()
def start_feed():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    global cap, suspicious_count
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"message": "Error: Cannot open the webcam."}), 500
    suspicious_count = 0
    return jsonify({"message": "Camera feed started"}), 200

@cctv_bp.route("/cctv/stop", methods=["POST", "OPTIONS"])
@cross_origin()
def stop_feed():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    global cap
    if cap and cap.isOpened():
        cap.release()
        cv2.destroyAllWindows()
    return jsonify({"message": "Camera feed stopped"}), 200

@cctv_bp.route("/snapshots/<path:filename>", methods=["GET", "OPTIONS"])
@cross_origin()
def download_file(filename):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    snapshots_dir = os.path.join(os.path.dirname(__file__), "..", "snapshots")
    return send_from_directory(snapshots_dir, filename)