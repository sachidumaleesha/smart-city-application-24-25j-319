# filepath: d:\RESEARCH\PythonFiles\CodeBase\smart-city-application-24-25j-319\server\app\__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    # CORS(app, resources={r"/api/*": {"origins": "*"}})
    CORS(app)  # Enable CORS for Next.js requests

    # Register accident detection blueprint

    from app.routes.accidentDetection.youtubeDetection import youtube_bp
    from app.routes.accidentDetection.accidentDetection import accident_bp
    from app.routes.wasteManagement.wasteTypeDetection import wasteManagement_bp
    from .routes.surveillanceEnhancementStream import cctv_bp
    from .routes.surveillance_enhancement import cctv_control_bp

    
    app.register_blueprint(wasteManagement_bp, url_prefix="/api/wasteManagement")
    app.register_blueprint(accident_bp, url_prefix="/api/accidentDetection")
    app.register_blueprint(youtube_bp, url_prefix="/api/youtubeDetection")

    # Register CCTV streaming routes (if any)
    app.register_blueprint(cctv_bp)

    # Register CCTV control endpoints with prefix /cctv
    app.register_blueprint(cctv_control_bp, url_prefix="/cctv")

    return app