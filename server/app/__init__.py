from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for Next.js requests

    # Register accident detection blueprint

    from app.routes.accidentDetection.youtubeDetection import youtube_bp
    from app.routes.accidentDetection.accidentDetection import accident_bp
    # from app.routes.accidentDetection.accidenttesst import accident_bp
    # from app.routes.accidentDetection.accident import accident_bp
    from .routes.surveillanceEnhancementStream import cctv_bp
    from .routes.surveillance_enhancement import cctv_control_bp
    from .routes.yutubeSuspecious import analyser_bp

    # from app.routes.wasteManagement.wasteTypeDetection import wasteManagement_bp
    # app.register_blueprint(wasteManagement_bp, url_prefix="/api/wasteManagement")

    from app.routes.parkingManagement.spacePicker.spacePicker import parking_bp
    app.register_blueprint(parking_bp, url_prefix="/api/spacePicker")
    from app.routes.parkingManagement.anpr import anpr_bp
    app.register_blueprint(anpr_bp, url_prefix="/api/anpr")   # Register ANPR API routes
    
    app.register_blueprint(accident_bp, url_prefix="/api/accidentDetection")
    app.register_blueprint(youtube_bp, url_prefix="/api/youtubeDetection")

    # Register CCTV streaming routes (if any)
    app.register_blueprint(cctv_bp)
    app.register_blueprint(analyser_bp)

    # Register CCTV control endpoints with prefix /cctv
    app.register_blueprint(cctv_control_bp, url_prefix="/cctv")

    return app

