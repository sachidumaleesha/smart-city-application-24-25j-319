from flask import Blueprint, jsonify
import threading
import cv2
import tensorflow as tf
import numpy as np


cctv_control_bp = Blueprint("cctv_control", __name__)

# Global variables to hold the model and a flag if needed.
model = None
feed_running = False

def load_model():
    global model
    if model is None:
        model = tf.keras.models.load_model(r"C:\Users\nipun\Downloads\surveillance_enhancement_v6.h5", compile=False)
    return model

# Remove or disable the run_feed function that opens a separate window.
def run_feed():
    # This function is now deprecated since we use the streaming endpoint.
    pass

@cctv_control_bp.route("/start", methods=["POST"])
def start_feed():
    # Here you might simply signal that streaming should begin, but the camera
    # is actually accessed by your streaming endpoint.
    global feed_running
    if feed_running:
        return jsonify({"message": "CCTV feed already running"})
    feed_running = True
    return jsonify({"message": "CCTV feed started"})

@cctv_control_bp.route("/stop", methods=["POST"])
def stop_feed():
    global feed_running
    feed_running = False
    return jsonify({"message": "CCTV feed stopped"})

@cctv_control_bp.route("/snapshot", methods=["GET"])
def snapshot():
    # Only use the streaming endpoint to snapshot or implement snapshot using a new camera access.
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        return jsonify({"message": "Error: Cannot open the webcam."})
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return jsonify({"message": "Error: Cannot read frame."})
    cv2.imwrite("snapshot.jpg", frame)
    return jsonify({"message": "Snapshot taken and saved."})