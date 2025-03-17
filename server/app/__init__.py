from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for Next.js requests

    # Import and register blueprints (routes)
    from app.routes.accidentDetection import accident_bp
    # from app.routes.wasteManagement.wasteTypeDetection import wasteManagement_bp

    app.register_blueprint(accident_bp, url_prefix="/api/accidentDetection")
    # app.register_blueprint(wasteManagement_bp, url_prefix="/api/wasteManagement")

    return app
