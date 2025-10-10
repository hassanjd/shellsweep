from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Import blueprints
from visualmap_flask import bp as visualmap_bp
from portscanner_flask import bp as portscanner_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register blueprints
app.register_blueprint(visualmap_bp)
app.register_blueprint(portscanner_bp)

# Path to the React build directory
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React app for all non-API routes"""
    if path != "" and os.path.exists(os.path.join(REACT_BUILD_DIR, path)):
        return send_from_directory(REACT_BUILD_DIR, path)
    else:
        # Serve index.html for client-side routing
        return send_from_directory(REACT_BUILD_DIR, 'index.html')

if __name__ == '__main__':
    print("Starting Flask application on http://localhost:8000")
    print("Available endpoints:")
    print("  GET  /api/devices - Get network devices")
    print("  POST /api/scan - Start a port scan")
    print("  GET  /api/current-scan - Get latest scan results")
    print("  GET  /api/scan-history - Get scan history")
    print("  Frontend served from /")
    app.run(host='localhost', port=8000, debug=True)
