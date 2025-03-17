import os
import cv2
import time
import numpy as np
import tensorflow as tf
from flask import Blueprint, jsonify, request
import yt_dlp as youtube_dl

# Create blueprint for YouTube detection
analyser_bp = Blueprint("youtubeanalyser", __name__)

# Load the trained model (update the path/name as needed)
model_path = os.path.join(os.path.dirname(__file__), "..", "dbModels", "surveillance_enhancement_v6.h5")
model = tf.keras.models.load_model(model_path, compile=False)
IMAGE_SIZE = (128, 128)

def get_stream_url(youtube_url):
    """
    Attempts to extract a direct stream URL from a YouTube URL using yt-dlp.
    Uses a simpler format option and includes a fallback to iterate available formats.
    Uncomment and update the 'cookies' option if age-restricted videos require authentication.
    """
    # Optional: set the cookies file if required
    # cookies_file = os.path.join(os.path.dirname(__file__), "cookies.txt")
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        # Use a simpler format so that a direct URL is returned.
        'format': 'best[ext=mp4]',
        # Uncomment and set your cookies file path if needed:
        # 'cookies': cookies_file,
    }
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        try:
            info_dict = ydl.extract_info(youtube_url, download=False)
            print("Video title:", info_dict.get("title"))
            print("Available formats:")
            for f in info_dict.get("formats", []):
                print(f"format {f.get('format_id')}: {f.get('ext')} - {f.get('format_note')}")
            # Try to get the direct URL from the info dict.
            stream_url = info_dict.get("url", None)
            # Fallback: loop over available formats and pick the first mp4 URL if not found.
            if stream_url is None and "formats" in info_dict:
                for fmt in info_dict["formats"]:
                    if fmt.get("ext") == "mp4":
                        stream_url = fmt.get("url")
                        break
            return stream_url
        except Exception as e:
            print("Error extracting stream URL:", e)
            return None

@analyser_bp.route("/youtube/detect", methods=["POST"])
def detect_youtube():
    data = request.get_json()
    video_url = data.get("video_url")
    if not video_url:
        return jsonify({"error": "Missing video_url parameter"}), 400

    # Extract the direct stream URL
    stream_url = get_stream_url(video_url)
    if stream_url is None:
        return jsonify({"error": "Failed to extract stream URL"}), 500

    # Open the video stream using cv2.VideoCapture
    cap = cv2.VideoCapture(stream_url)
    if not cap.isOpened():
        return jsonify({"error": "Cannot open video stream"}), 500

    # Capture one frame from the stream
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return jsonify({"error": "Failed to capture frame"}), 500

    # Preprocess the frame for prediction
    try:
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        resized = tf.image.resize(img_rgb, IMAGE_SIZE)
        scaled = resized / 255.0
        input_image = np.expand_dims(scaled.numpy(), axis=0)
    except Exception as e:
        return jsonify({"error": "Error processing image: " + str(e)}), 500

    # Get prediction from the model
    prediction = model.predict(input_image)[0][0]
    threshold = 0.8  # Adjust threshold as needed
    result = "Suspicious Activity Detected!" if prediction < threshold else "Normal Activity"

    # Return results as JSON
    return jsonify({
        "result": result,
        "prediction": float(prediction),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })