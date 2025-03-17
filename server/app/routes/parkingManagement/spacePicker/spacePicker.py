import os
import time
import pickle
import cv2
import numpy as np
from flask import Blueprint, Response, jsonify, send_from_directory

# Blueprint for Flask app
parking_bp = Blueprint("spacePicker", __name__)

# Load parking slot positions
PARKING_POSITIONS_FILE = os.path.join(os.path.dirname(__file__), "CarParkingPos")

try:
    with open(PARKING_POSITIONS_FILE, "rb") as f:
        posList = pickle.load(f)
except FileNotFoundError:
    posList = []

cap = cv2.VideoCapture(0)  # Open webcam
if not cap.isOpened():
    print("Error: Cannot open the webcam.")

# Directory for saving snapshots
SNAPSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "snapshots")
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

def process_frame(frame):
    """ Process frame to detect empty and occupied parking spots. """
    imgGray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)

    spaceCounter = 0  # Track available spaces

    for pos in posList:
        x1, y1, x2, y2 = pos
        width, height = abs(x2 - x1), abs(y2 - y1)
        imgCrop = imgDilate[y1:y1 + height, x1:x1 + width]
        count = cv2.countNonZero(imgCrop)

        if count < 2000:  # Free space
            color = (0, 255, 0)  # Green
            spaceCounter += 1
        else:
            color = (0, 0, 255)  # Red

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, str(count), (x1 + 5, y1 + height - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    cv2.putText(frame, f'Free: {spaceCounter}/{len(posList)}', (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
    
    return frame, spaceCounter

def gen_frames():
    """ Generate live video frames with parking detection overlay. """
    while True:
        success, frame = cap.read()
        if not success:
            break

        frame, _ = process_frame(frame)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@parking_bp.route("/live")
def live_feed():
    """ Live video streaming route. """
    return Response(gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

@parking_bp.route("/snapshot", methods=["GET"])
def snapshot():
    """ Capture and save a snapshot of the parking area. """
    ret, frame = cap.read()
    if not ret:
        return jsonify({"error": "Failed to capture snapshot"}), 500

    frame, free_spaces = process_frame(frame)
    
    filename = f"snapshot_{int(time.time())}.jpg"
    filepath = os.path.join(SNAPSHOT_DIR, filename)
    cv2.imwrite(filepath, frame)

    image_url = f"http://localhost:5000/snapshots/{filename}"
    
    snapshot_record = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "image_url": image_url,
        "free_spaces": free_spaces,
        "total_spaces": len(posList),
    }

    return jsonify(snapshot_record)

@parking_bp.route("/snapshots/<path:filename>")
def download_snapshot(filename):
    """ Serve saved snapshots. """
    return send_from_directory(SNAPSHOT_DIR, filename)

@parking_bp.route("/parking/reset", methods=["POST"])
def reset_parking():
    """ Reset the parking slot positions. """
    global posList
    posList = []
    with open(PARKING_POSITIONS_FILE, "wb") as f:
        pickle.dump(posList, f)
    return jsonify({"message": "Parking positions reset"}), 200
