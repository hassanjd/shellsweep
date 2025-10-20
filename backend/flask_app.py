from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Import blueprints
from visualmap_flask import bp as visualmap_bp
from portscanner_flask import bp as portscanner_bp

# Import reverse shell blueprint with fallback
try:
    from reverseshell_flask import bp as reverseshell_bp
except ImportError:
    # Create a mock blueprint if psutil is not available
    from flask import Blueprint, jsonify
    reverseshell_bp = Blueprint('reverseshell', __name__)

    @reverseshell_bp.route('/api/reverse-shell/health', methods=['GET'])
    def reverse_shell_health():
        return jsonify({"message": "Reverse Shell Detector API unavailable - psutil not installed", "status": "unavailable"})

    @reverseshell_bp.route('/api/reverse-shell/scan', methods=['POST'])
    def start_reverse_shell_scan():
        return jsonify({"error": "Reverse shell detection unavailable - psutil not installed"}), 503

    @reverseshell_bp.route('/api/reverse-shell/current-scan', methods=['GET'])
    def get_current_reverse_shell_scan():
        return jsonify({"error": "Reverse shell detection unavailable - psutil not installed"}), 503

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register blueprints
app.register_blueprint(visualmap_bp)
app.register_blueprint(portscanner_bp)
app.register_blueprint(reverseshell_bp)

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
    print("  POST /api/reverse-shell/scan - Start reverse shell detection")
    print("  GET  /api/reverse-shell/current-scan - Get latest reverse shell scan")
    print("  GET  /api/reverse-shell/history - Get reverse shell scan history")
    print("  Frontend served from /")
    app.run(host='localhost', port=8000, debug=True)
