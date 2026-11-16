import os
import psutil
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import Optional

from services.ws_manager import progress_manager
from services.ffmpeg_helper import get_ffmpeg_binary
from services.tiktok_service import get_tiktok_metadata
from services.spotify_service import get_spotify_metadata
from services.media_service import get_media_metadata
from services.task_runner import dispatch_task

DOWNLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "downloads"))
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Glassmorphism Utility Hub API",
    version="3.0.0",
    description="Backend for All-in-One Utility Hub: TikTok, Instagram, YouTube, Spotify, PDF, and Media Tools"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()
    progress_manager.set_loop(loop)
    print("=" * 60)
    print("🚀 Utility Hub Backend v3.0 started!")
    print(f"📁 Download folder: {DOWNLOAD_DIR}")
    print(f"🎬 FFmpeg binary: {get_ffmpeg_binary()}")
    print("=" * 60)

# Request Models
class ExtractRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format: Optional[str] = "mp4"
    task_id: str
    service_type: Optional[str] = "generic"

class AdminVerifyRequest(BaseModel):
    password: str

# 1. System Status
@app.get("/api/status")
async def get_system_status():
    mem = psutil.virtual_memory()
    return {
        "status": "online",
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_percent": mem.percent,
        "ram_used_mb": round(mem.used / (1024 * 1024), 1),
        "ram_total_mb": round(mem.total / (1024 * 1024), 1),
        "ffmpeg_available": bool(get_ffmpeg_binary()),
        "ffmpeg_path": get_ffmpeg_binary() or "Not found",
        "active_downloads": len(os.listdir(DOWNLOAD_DIR))
    }

# 2. WebSocket for Real-time Download Progress
@app.websocket("/ws/progress/{task_id}")
async def websocket_progress_endpoint(websocket: WebSocket, task_id: str):
    await progress_manager.connect(websocket, task_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        progress_manager.disconnect(websocket, task_id)
    except Exception:
        progress_manager.disconnect(websocket, task_id)

# 3. TikTok & Alight Motion Extraction
@app.post("/api/extract/tiktok")
async def extract_tiktok_info(req: ExtractRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL TikTok tidak boleh kosong.")
    try:
        loop = asyncio.get_event_loop()
        meta = await loop.run_in_executor(None, get_tiktok_metadata, req.url)
        return {"success": True, "data": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memeriksa tautan TikTok: {str(e)}")

@app.post("/api/download/tiktok")
async def download_tiktok_endpoint(req: DownloadRequest):
    if not req.url or not req.task_id:
        raise HTTPException(status_code=400, detail="Parameter URL dan task_id diperlukan.")

    params = {
        "url": req.url,
        "output_dir": DOWNLOAD_DIR,
        "task_id": req.task_id,
        "format_choice": req.format
    }
    dispatch_task("tiktok", params)
    return {"success": True, "message": "Unduhan TikTok telah dimulai.", "task_id": req.task_id}

# 4. Spotify to MP3
@app.post("/api/extract/spotify")
async def extract_spotify_info(req: ExtractRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL Spotify tidak boleh kosong.")
    try:
        loop = asyncio.get_event_loop()
        meta = await loop.run_in_executor(None, get_spotify_metadata, req.url)
        return {"success": True, "data": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil metadata Spotify: {str(e)}")

@app.post("/api/download/spotify")
async def download_spotify_endpoint(req: DownloadRequest):
    if not req.url or not req.task_id:
        raise HTTPException(status_code=400, detail="Parameter URL dan task_id diperlukan.")

    params = {
        "url": req.url,
        "output_dir": DOWNLOAD_DIR,
        "task_id": req.task_id
    }
    dispatch_task("spotify", params)
    return {"success": True, "message": "Proses konversi Spotify ke MP3 dimulai.", "task_id": req.task_id}

# 5. Generic Media (YouTube, Instagram, etc.)
@app.post("/api/extract/media")
async def extract_media_info(req: ExtractRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL media tidak boleh kosong.")
    try:
        loop = asyncio.get_event_loop()
        meta = await loop.run_in_executor(None, get_media_metadata, req.url)
        return {"success": True, "data": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memeriksa media: {str(e)}")

@app.post("/api/download/media")
async def download_media_endpoint(req: DownloadRequest):
    if not req.url or not req.task_id:
        raise HTTPException(status_code=400, detail="Parameter URL dan task_id diperlukan.")

    srv_type = req.service_type or "generic"
    params = {
        "url": req.url,
        "output_dir": DOWNLOAD_DIR,
        "task_id": req.task_id,
        "format_choice": req.format
    }
    dispatch_task(srv_type, params)
    return {"success": True, "message": f"Unduhan {srv_type} telah dimulai.", "task_id": req.task_id}

# 6. File Retrieval Endpoint
@app.get("/api/download/file/{filename}")
async def get_downloaded_file(filename: str):
    clean_name = os.path.basename(filename)
    file_path = os.path.join(DOWNLOAD_DIR, clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan atau telah kedaluwarsa.")
    
    return FileResponse(
        path=file_path,
        filename=clean_name,
        media_type="application/octet-stream"
    )

# 7. Easter Egg: Admin Password Verification
@app.post("/api/admin/verify")
async def verify_admin(req: AdminVerifyRequest):
    ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "admin123")
    if req.password == ADMIN_PASS:
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage(".")
        return {
            "authorized": True,
            "role": "SuperAdmin / Root",
            "server_telemetry": {
                "os": os.name,
                "cpu_count": psutil.cpu_count(logical=True),
                "cpu_usage": f"{psutil.cpu_percent()}%",
                "ram_usage": f"{mem.percent}% ({round(mem.used/(1024*1024))}MB / {round(mem.total/(1024*1024))}MB)",
                "disk_free": f"{round(disk.free / (1024*1024*1024), 2)} GB",
                "cached_files_count": len(os.listdir(DOWNLOAD_DIR)),
                "ffmpeg_location": get_ffmpeg_binary() or "Embedded/System",
            },
            "token": "admin_session_token_xyz"
        }
    else:
        raise HTTPException(status_code=401, detail="Kata sandi admin salah.")
