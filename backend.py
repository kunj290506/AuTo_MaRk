"""
AutoMark - High Accuracy Object Detection
Uses YOLOv8 for accurate detection + filename-based class names
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timedelta
from jose import jwt
import hashlib
import shutil
import zipfile
import uuid
import cv2
import time
import numpy as np
import re

app = FastAPI(title="AutoMark API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
SECRET = "automark-2024"

def hash_pw(p): return hashlib.sha256(p.encode()).hexdigest()
def verify_pw(p, h): return hash_pw(p) == h

users_db = {"demo@automark.ai": {"email": "demo@automark.ai", "name": "Demo", "hashed_password": hash_pw("demo123")}}

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@app.post("/api/auth/login", response_model=Token)
async def login(creds: UserLogin):
    user = users_db.get(creds.email)
    if not user or not verify_pw(creds.password, user["hashed_password"]):
        raise HTTPException(401, "Invalid credentials")
    token = jwt.encode({"sub": creds.email, "exp": datetime.utcnow() + timedelta(days=1)}, SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer", "user": {"email": user["email"], "name": user["name"]}}

@app.post("/api/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    if user.email in users_db:
        raise HTTPException(400, "Email exists")
    users_db[user.email] = {"email": user.email, "name": user.name, "hashed_password": hash_pw(user.password)}
    token = jwt.encode({"sub": user.email, "exp": datetime.utcnow() + timedelta(days=1)}, SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer", "user": {"email": user.email, "name": user.name}}

# ================================
# YOLO Model - High Accuracy
# ================================
import torch
from ultralytics import YOLO

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Device: {DEVICE}")

# Load SAM (Segment Anything Model) - Latest Large Version
print("Loading SAM 2.1 Large (High Accuracy)...")
try:
    from ultralytics import SAM
    model = SAM("sam2.1_l.pt")  # Large model for maximum accuracy
    print("SAM 2.1 Large Loaded successfully!")
except Exception as e:
    print(f"Error loading SAM: {e}")
    # Fallback or error handling

# Directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("output")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

progress_store = {}

# ================================
# Helper Functions
# ================================
def get_class_from_filename(filename):
    """Extract class name from filename: airplane_1.jpg -> airplane"""
    name = Path(filename).stem
    match = re.match(r'^(.+?)_?\d*$', name)
    return match.group(1).replace('_', ' ') if match else name

def draw_box(img, x1, y1, x2, y2, label):
    """Draw bounding box with label"""
    # Green box
    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    # Label
    text = f"{label}"
    font = cv2.FONT_HERSHEY_SIMPLEX
    scale, thick = 0.5, 1
    (tw, th), _ = cv2.getTextSize(text, font, scale, thick)
    
    # Position at top-right
    tx = x2 - tw - 4
    ty = y1 - 4 if y1 > th + 8 else y1 + th + 4
    if tx < 0: tx = x1 + 4
    
    # Background + text
    cv2.rectangle(img, (tx-2, ty-th-2), (tx+tw+2, ty+2), (0, 255, 0), -1)
    cv2.putText(img, text, (tx, ty), font, scale, (0, 0, 0), thick)

# ================================
# Main Endpoint
# ================================
@app.get("/")
async def root():
    return {"message": "AutoMark API", "model": "SAM", "device": DEVICE}

@app.post("/api/annotate")
async def annotate(files: list[UploadFile] = File(...), description: str = None):
    if not files:
        raise HTTPException(400, "No files")
    
    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_out = OUTPUT_DIR / session_id
    
    session_dir.mkdir(parents=True)
    session_out.mkdir(parents=True)
    (session_out / "images").mkdir()
    (session_out / "labels").mkdir()
    (session_out / "annotated").mkdir()
    
    # Save files
    for f in files:
        path = session_dir / f.filename
        content = await f.read()
        with open(path, "wb") as fp:
            fp.write(content)
        
        if f.filename.lower().endswith(".zip"):
            try:
                with zipfile.ZipFile(path, 'r') as z:
                    z.extractall(session_dir)
            except: pass
    
    # Get images
    exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    images = [f for f in session_dir.rglob("*") if f.suffix.lower() in exts]
    
    if not images:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(400, "No images")
    
    progress_store[session_id] = {"current": 0, "total": len(images), "started": time.time()}
    
    processed = []
    class_registry = {}
    next_id = 0
    
    for idx, img_path in enumerate(images):
        try:
            progress_store[session_id]["current"] = idx
            
            img = cv2.imread(str(img_path))
            if img is None: continue
            
            h, w = img.shape[:2]
            
            # Get class from filename
            file_class = get_class_from_filename(img_path.name)
            if file_class not in class_registry:
                class_registry[file_class] = next_id
                next_id += 1
            class_id = class_registry[file_class]
            
            # Run SAM detection
            # SAM returns masks. We'll find bounding boxes of all masks.
            results = model(str(img_path), verbose=False, device=DEVICE)
            
            labels = []
            
            # Ultralytics SAM results
            for result in results:
                if result.masks is None: continue
                
                # Get all masks
                masks = result.masks.data.cpu().numpy()  # (N, H, W)
                
                for mask in masks:
                    # Find bounding box of mask
                    pos_y, pos_x = np.where(mask > 0.5)
                    if len(pos_x) == 0: continue
                    
                    x1, x2 = int(np.min(pos_x)), int(np.max(pos_x))
                    y1, y2 = int(np.min(pos_y)), int(np.max(pos_y))
                    
                    # YOLO format
                    x_center = ((x1 + x2) / 2) / w
                    y_center = ((y1 + y2) / 2) / h
                    box_w = (x2 - x1) / w
                    box_h = (y2 - y1) / h
                    
                    # Clamp
                    x_center = max(0, min(1, x_center))
                    y_center = max(0, min(1, y_center))
                    box_w = max(0, min(1, box_w))
                    box_h = max(0, min(1, box_h))
                    
                    labels.append(f"{class_id} {x_center:.6f} {y_center:.6f} {box_w:.6f} {box_h:.6f}")
                    draw_box(img, x1, y1, x2, y2, file_class)
            
            # Save
            shutil.copy2(img_path, session_out / "images" / img_path.name)
            
            with open(session_out / "labels" / (img_path.stem + ".txt"), 'w') as f:
                f.write('\n'.join(labels))
            
            cv2.imwrite(str(session_out / "annotated" / img_path.name), img)
            
            processed.append({"filename": img_path.name, "detections": len(labels)})
            progress_store[session_id]["current"] = idx + 1
            
        except Exception as e:
            print(f"Error {img_path}: {e}")
    
    # Generate classes.txt
    sorted_classes = sorted(class_registry.items(), key=lambda x: x[1])
    with open(session_out / "classes.txt", 'w') as f:
        for name, _ in sorted_classes:
            f.write(f"{name}\n")
    
    # Generate dataset.yaml
    with open(session_out / "dataset.yaml", 'w') as f:
        f.write("# AutoMark YOLO Dataset\n")
        f.write("path: ./\n")
        f.write("train: images\n")
        f.write("val: images\n\n")
        f.write(f"nc: {len(class_registry)}\n\n")
        f.write("names:\n")
        for name, cid in sorted_classes:
            f.write(f"  {cid}: '{name}'\n")
    
    # Create ZIP
    zip_path = session_out / "dataset.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(session_out / "dataset.yaml", "dataset.yaml")
        z.write(session_out / "classes.txt", "classes.txt")
        for f in (session_out / "images").iterdir():
            z.write(f, f"images/{f.name}")
        for f in (session_out / "labels").iterdir():
            z.write(f, f"labels/{f.name}")
        for f in (session_out / "annotated").iterdir():
            z.write(f, f"annotated/{f.name}")
    
    return {
        "success": True,
        "session_id": session_id,
        "processed_files": processed,
        "total_images": len(processed),
        "total_detections": sum(p["detections"] for p in processed)
    }

@app.get("/api/progress/{session_id}")
async def progress(session_id: str):
    p = progress_store.get(session_id, {})
    return {"current": p.get("current", 0), "total": p.get("total", 0)}

@app.get("/api/download/{session_id}")
async def download(session_id: str):
    path = OUTPUT_DIR / session_id / "dataset.zip"
    if not path.exists():
        raise HTTPException(404, "Not found")
    return FileResponse(path, filename="yolo_dataset.zip")

app.mount("/output", StaticFiles(directory="output"), name="output")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
