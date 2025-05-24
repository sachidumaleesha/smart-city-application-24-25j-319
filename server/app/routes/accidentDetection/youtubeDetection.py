from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import tensorflow as tf
import os
import subprocess
import base64
import uuid
import time
from keras.utils import custom_object_scope

youtube_bp = Blueprint("youtubeDetection", __name__)

# ✅ Load model with custom objects
MODEL_PATH = "app/mlModels/modelNew.h5"

def get_custom_objects():
    class CustomInputLayer(tf.keras.layers.InputLayer):
        def __init__(self, input_shape=None, batch_size=None, dtype=None, sparse=False, name=None, **kwargs):
            if 'batch_shape' in kwargs:
                batch_shape = kwargs.pop('batch_shape')
                if isinstance(batch_shape, (list, tuple)):
                    input_shape = batch_shape[1:]
                    batch_size = batch_shape[0]
            
            # Convert input_shape to TensorShape if it's not already
            if input_shape is not None and not isinstance(input_shape, tf.TensorShape):
                input_shape = tf.TensorShape(input_shape)
            
            super().__init__(input_shape=input_shape, batch_size=batch_size,
                           dtype=dtype, sparse=sparse, name=name, **kwargs)

        def get_config(self):
            config = super().get_config()
            if 'batch_shape' in config:
                config['batch_shape'] = tf.TensorShape(config['batch_shape']).as_list()
            return config

    class DTypePolicy:
        def __init__(self, name):
            self._name = name
            self._dtype = tf.dtypes.as_dtype(name)

        @property
        def name(self):
            return self._name

        @property
        def compute_dtype(self):
            return self._dtype

        @property
        def variable_dtype(self):
            return self._dtype

        def __eq__(self, other):
            if hasattr(other, 'name'):
                return self.name == other.name
            return False

        @classmethod
        def from_config(cls, config):
            if isinstance(config, dict) and 'name' in config:
                return cls(config['name'])
            return cls('float32')

        def get_config(self):
            return {'name': self.name}

    # Custom Conv2D layer to handle dtype policy
    class CustomConv2D(tf.keras.layers.Conv2D):
        def __init__(self, *args, **kwargs):
            if 'dtype' in kwargs and isinstance(kwargs['dtype'], dict):
                dtype_config = kwargs['dtype']
                if isinstance(dtype_config, dict) and 'config' in dtype_config:
                    kwargs['dtype'] = dtype_config['config'].get('name', 'float32')
            super().__init__(*args, **kwargs)

        def get_config(self):
            config = super().get_config()
            if isinstance(config.get('input_shape'), (list, tuple)):
                config['input_shape'] = tf.TensorShape(config['input_shape']).as_list()
            return config

    # Return all custom objects needed
    return {
        'InputLayer': CustomInputLayer,
        'CustomInputLayer': CustomInputLayer,
        'DTypePolicy': DTypePolicy,
        'Conv2D': CustomConv2D
    }

def load_model_with_retries(max_retries=3, delay=1):
    """Load model with multiple retries and proper error handling"""
    last_exception = None
    
    # Define expected input shape
    expected_shape = (None, 250, 250, 3)
    
    for attempt in range(max_retries):
        try:
            print(f"⌛ Loading model from {MODEL_PATH} (Attempt {attempt + 1}/{max_retries})")
            
            # Create custom objects with proper input shape handling
            custom_objects = get_custom_objects()
            
            with custom_object_scope(custom_objects):
                # Try loading with explicit input shape
                model = tf.keras.models.load_model(
                    MODEL_PATH,
                    compile=False,
                    custom_objects=custom_objects
                )
                
                print(f"✅ Model loaded successfully with input shape: {model.input_shape}")
                return model
                
        except Exception as e:
            last_exception = e
            print(f"❌ Error loading model (Attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                print(f"⌛ Waiting {delay} seconds before retrying...")
                time.sleep(delay)
    
    print("❌ All attempts to load model failed")
    if last_exception:
        raise last_exception
    raise Exception("Failed to load model after all retries")

try:
    model = load_model_with_retries()
except Exception as e:
    print(f"❌ Fatal error loading model: {str(e)}")
    raise

# ✅ Preprocess the frame
def preprocess_frame(frame, img_height=250, img_width=250):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (img_width, img_height))
    frame_normalized = frame_resized / 255.0
    return np.expand_dims(frame_normalized, axis=0)

# ✅ Smoothing params (adjust for stricter detection)
DETECTION_HISTORY_SIZE = 7
REQUIRED_POSITIVE_DETECTIONS = 5
PREDICTION_THRESHOLD = 0.90  # Very strict threshold
COOLDOWN_PERIOD_SEC = 3    # Minimum 5 seconds between accidents

# ✅ Smoothing + debounce
def predict_accident_with_strict_smoothing(frame, detection_history):
    preprocessed = preprocess_frame(frame)
    prediction = model.predict(preprocessed)[0][0]

    # ✅ Only count high-confidence predictions
    accident_predicted = prediction > PREDICTION_THRESHOLD

    # ✅ Keep history size limited
    detection_history.append(accident_predicted)
    if len(detection_history) > DETECTION_HISTORY_SIZE:
        detection_history.pop(0)

    # ✅ Confirm accident only if enough positives in recent history
    confirmed_accident = detection_history.count(True) >= REQUIRED_POSITIVE_DETECTIONS

    return confirmed_accident, prediction

# ✅ Download YouTube video
def download_youtube_video(youtube_url, output_dir="downloads"):
    os.makedirs(output_dir, exist_ok=True)
    video_filename = f"{uuid.uuid4()}.mp4"
    output_path = os.path.join(output_dir, video_filename)

    command = f"yt-dlp --quiet --no-warnings --merge-output-format mp4 -o {output_path} {youtube_url}"
    process = subprocess.run(command, shell=True, text=True, capture_output=True)

    if process.returncode != 0:
        raise Exception(f"yt-dlp failed: {process.stderr.strip()}")

    return output_path

# ✅ API endpoint to analyze YouTube videos
@youtube_bp.route("/analyze-youtube", methods=["POST"])
def analyze_youtube_video():
    data = request.json
    youtube_url = data.get("youtubeUrl")

    if not youtube_url:
        return jsonify({"error": "YouTube URL is required!"}), 400

    try:
        video_path = download_youtube_video(youtube_url)
        print(f"✅ Downloaded video to {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Could not open the downloaded video file.")

        frame_count = 0
        accident_frames = []
        detection_history = []
        last_detection_time = 0  # To prevent duplicate detection in short time

        print("🚀 Starting accident detection...")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30  # Default 30 if not detected
        cooldown_frames = int(COOLDOWN_PERIOD_SEC * fps)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # ✅ Analyze every 30th frame
            if frame_count % 30 == 0:
                confirmed_accident, raw_prediction = predict_accident_with_strict_smoothing(frame, detection_history)

                # ✅ Ensure cooldown period
                if confirmed_accident and (frame_count - last_detection_time > cooldown_frames):
                    print(f"🚨 Accident detected at Frame #{frame_count} (Prediction Score: {raw_prediction:.2f})")

                    # Convert frame to base64
                    _, buffer = cv2.imencode(".jpg", frame)
                    frame_base64 = base64.b64encode(buffer).decode("utf-8")

                    accident_frames.append({
                        "frame_number": frame_count,
                        "frame": frame_base64
                    })

                    last_detection_time = frame_count  # Reset cooldown

        cap.release()
        if os.path.exists(video_path):
            os.remove(video_path)
            print(f"🗑️ Deleted video file: {video_path}")

        if accident_frames:
            print(f"✅ Accidents detected in {len(accident_frames)} frames.")
            return jsonify({
                "accidents_detected": True,
                "frames": accident_frames
            }), 200
        else:
            print("✅ No accidents detected in the video.")
            return jsonify({
                "accidents_detected": False,
                "frames": []
            }), 200

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
