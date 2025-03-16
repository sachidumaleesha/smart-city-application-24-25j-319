# filepath: d:\RESEARCH\PythonFiles\CodeBase\smart-city-application-24-25j-319\server\app\__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    CORS(app)  # Enable CORS for Next.js requests

    # Import and register blueprints (routes)
    from app.routes.accidentDetection import accident_bp
    from app.routes.wasteManagement.wasteTypeDetection import wasteManagement_bp

    # Register accidentDetection routes:
    from .routes.accidentDetection import accident_bp
    app.register_blueprint(accident_bp, url_prefix="/api/accidentDetection")
    app.register_blueprint(wasteManagement_bp, url_prefix="/api/wasteManagement")

    # Register CCTV streaming routes (if any)
    from .routes.surveillanceEnhancementStream import cctv_bp
    app.register_blueprint(cctv_bp)

    # Register CCTV control endpoints with prefix /cctv
    from .routes.surveillance_enhancement import cctv_control_bp
    app.register_blueprint(cctv_control_bp, url_prefix="/cctv")

    return app