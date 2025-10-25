from fastapi import FastAPI,APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import subprocess
import uuid
from ..utils.extraction import analyze_firmware_pipeline

router = APIRouter(
    prefix="/firmware",
    tags=["Firmware"]
)

# Folder in Windows to store uploaded files
UPLOAD_DIR = os.path.join(os.getcwd(), "firmware_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze_firmware")
async def analyze_firmware(file: UploadFile = File(...)):
    # Save uploaded firmware to a Windows-accessible folder under a session
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, f"session-{session_id}")
    os.makedirs(session_dir, exist_ok=True)

    file_location = os.path.join(session_dir, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    print(f"Firmware saved at: {file_location}")

    try:
        # Run improved staged extraction pipeline
        result = analyze_firmware_pipeline(file_location)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}
