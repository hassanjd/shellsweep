from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uvicorn

# Import routers
from .api.visualmap import router as visualmap_router
from .api.portscanner import router as portscanner_router
from .api.firmware_backend import router as firmware_router

# Import reverse shell router with fallback
try:
    from .api.reverseshell import router as reverseshell_router
except ImportError:
    # Create a mock router if psutil is not available
    from fastapi import APIRouter
    from fastapi.responses import JSONResponse

    reverseshell_router = APIRouter()

    @reverseshell_router.get('/api/reverse-shell/health')
    async def reverse_shell_health():
        return JSONResponse(
            content={"message": "Reverse Shell Detector API unavailable - psutil not installed", "status": "unavailable"},
            status_code=200
        )

    @reverseshell_router.post('/api/reverse-shell/scan')
    async def start_reverse_shell_scan():
        return JSONResponse(
            content={"error": "Reverse shell detection unavailable - psutil not installed"},
            status_code=503
        )

    @reverseshell_router.get('/api/reverse-shell/current-scan')
    async def get_current_reverse_shell_scan():
        return JSONResponse(
            content={"error": "Reverse shell detection unavailable - psutil not installed"},
            status_code=503
        )

app = FastAPI(title="ShellSweep API", description="Network security scanning and reverse shell detection API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(visualmap_router)
app.include_router(portscanner_router)
app.include_router(firmware_router)
app.include_router(reverseshell_router)

# Path to the React build directory
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'dist')

# Mount static files if dist directory exists
if os.path.exists(REACT_BUILD_DIR):
    app.mount("/static", StaticFiles(directory=REACT_BUILD_DIR), name="static")

@app.get("/")
@app.get("/{path:path}")
async def serve_react_app(path: str = ""):
    """Serve React app for all non-API routes"""
    file_path = os.path.join(REACT_BUILD_DIR, path)
    if path and os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    else:
        # Serve index.html for client-side routing
        index_path = os.path.join(REACT_BUILD_DIR, 'index.html')
        if os.path.exists(index_path):
            return FileResponse(index_path)
        else:
            return {"error": "Frontend not built yet"}

if __name__ == '__main__':
    print("Starting FastAPI application on http://localhost:8000")
    print("Available endpoints:")
    print("  GET  /api/devices - Get network devices")
    print("  POST /api/scan - Start a port scan")
    print("  GET  /api/current-scan - Get latest scan results")
    print("  GET  /api/scan-history - Get scan history")
    print("  POST /firmware/analyze_firmware - Analyze firmware for vulnerabilities")
    print("  POST /api/reverse-shell/scan - Start reverse shell detection")
    print("  GET  /api/reverse-shell/current-scan - Get latest reverse shell scan")
    print("  GET  /api/reverse-shell/history - Get reverse shell scan history")
    print("  Frontend served from /")
    print("  API docs available at http://localhost:8000/docs")
    uvicorn.run(app, host='localhost', port=8000)
