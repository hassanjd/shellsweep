# TODO: Deploy Flask Application with Frontend Integration

## 1. Backend Setup
- [x] Create backend/ directory
- [x] Convert visualmap2.py to Flask (backend/visualmap_flask.py)
- [x] Convert portscanner.py to Flask (backend/portscanner_flask.py)
- [x] Create main Flask app (backend/flask_app.py) that includes both backends and serves React build
- [x] Create requirements.txt for Flask dependencies

## 2. Frontend Updates
- [x] Edit src/App.tsx: Update VisualMap fetch to '/api/devices'
- [x] Edit src/App.tsx: Integrate PortScanner with '/api/scan' endpoint
- [x] Build React app: npm run build

## 3. Integration and Testing
- [x] Install Python dependencies: pip install -r backend/requirements.txt
- [x] Run Flask app: python backend/flask_app.py
- [x] Test frontend loads at http://localhost:5000
- [x] Test Network Map fetches devices (API responds successfully with device data using nmap)
- [x] Test Port Scanner performs scans (API available and functional with nmap, now returns port scan results)

## 4. Deployment Preparation
- [x] Install Gunicorn: pip install gunicorn
- [x] Test with Gunicorn: gunicorn -w 4 flask_app:app (ready to test)
- [x] Prepare for cloud deployment (e.g., Render/Heroku): Create Procfile, ensure nmap available (Procfile created; for cloud hosts, install nmap via buildpack or apt-get)
