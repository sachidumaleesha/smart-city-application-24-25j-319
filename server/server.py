from app import create_app
from flask_cors import CORS

app = create_app()

# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)
