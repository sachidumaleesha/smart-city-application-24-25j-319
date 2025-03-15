from flask import Blueprint, request, jsonify
from keras.models import load_model
from PIL import Image, ImageOps
import numpy as np
import io
import os

# Create blueprint
wasteManagement_bp = Blueprint("wasteManagement_bp", __name__)

# Initialize these as None first
model = None
class_names = None

def load_resources():
    global model, class_names
    
    # Get the directory where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Build absolute paths to the model and labels files
    # Adjust these paths based on where your files are actually located
    model_path = os.path.join(current_dir, "model.h5")
    labels_path = os.path.join(current_dir, "labels.txt")
    
    print(f"Loading model from: {model_path}")
    print(f"Loading labels from: {labels_path}")
    
    # Check if files exist
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    if not os.path.exists(labels_path):
        raise FileNotFoundError(f"Labels file not found at {labels_path}")
    
    # Load the model
    model = load_model(model_path, compile=False)
    # Load the labels
    class_names = open(labels_path, "r").readlines()

# Load resources when the module is imported
try:
    load_resources()
except Exception as e:
    print(f"Error loading resources: {e}")
    # You might want to handle this error more gracefully in a production environment
    
@wasteManagement_bp.route("/", methods=["GET"])
async def root():
    return {"message": "Waste Classification TFLite API is running!"}

@wasteManagement_bp.route("/health", methods=["GET"])
async def health_check():
    return {"status": "healthy"}

@wasteManagement_bp.route("/predict", methods=["POST"])
def predict_waste_type():
    # Check if model is loaded
    if model is None or class_names is None:
        return jsonify({"error": "Model not loaded. Check server logs."}), 500
        
    # Check if image is present in the request
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    
    # Read and process the image
    try:
        # Read image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Create the array of the right shape
        data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        
        # Resize and crop from the center
        size = (224, 224)
        image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array and normalize
        image_array = np.asarray(image)
        normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
        
        # Load the image into the array
        data[0] = normalized_image_array
        
        # Make prediction
        prediction = model.predict(data)
        index = np.argmax(prediction)
        class_name = class_names[index][2:].strip()  # Remove the first 2 chars and strip whitespace
        confidence_score = float(prediction[0][index])
        
        # Return results
        return jsonify({
            "class": class_name,
            "confidence": confidence_score
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500