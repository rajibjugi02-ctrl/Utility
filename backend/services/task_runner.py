import os
import concurrent.futures
from typing import Dict, Any
from .tiktok_service import download_tiktok_video
from .spotify_service import download_spotify_to_mp3
from .media_service import download_generic_media
from .ws_manager import progress_manager
from celery_app import celery_app

executor = concurrent.futures.ThreadPoolExecutor(max_workers=6)

def run_tiktok_download_sync(url: str, output_dir: str, task_id: str, format_choice: str = "mp4") -> Dict[str, Any]:
    try:
        filename = download_tiktok_video(url, output_dir, task_id, format_choice)
        file_path = os.path.join(output_dir, filename)
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        result = {
            "task_id": task_id,
            "status": "completed",
            "progress": 100.0,
            "speed": "0 MB/s",
            "eta": "0s",
            "filename": filename,
            "file_size": file_size,
            "download_url": f"/api/download/file/{filename}",
            "message": "Unduhan TikTok berhasil diselesaikan!"
        }
        progress_manager.push_progress_sync(task_id, result)
        return result
    except Exception as e:
        err_msg = str(e)
        progress_manager.push_progress_sync(task_id, {
            "task_id": task_id,
            "status": "error",
            "progress": 0,
            "error": err_msg,
            "message": f"Gagal mengunduh: {err_msg}"
        })
        return {"task_id": task_id, "status": "error", "error": err_msg}

def run_spotify_download_sync(url: str, output_dir: str, task_id: str) -> Dict[str, Any]:
    try:
        data = download_spotify_to_mp3(url, output_dir, task_id)
        filename = data["filename"]
        file_path = os.path.join(output_dir, filename)
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

        result = {
            "task_id": task_id,
            "status": "completed",
            "progress": 100.0,
            "speed": "0 MB/s",
            "eta": "0s",
            "filename": filename,
            "title": data.get("title"),
            "artist": data.get("artist"),
            "file_size": file_size,
            "download_url": f"/api/download/file/{filename}",
            "message": "Audio MP3 berhasil diekstrak dan disuntikkan metadata ID3!"
        }
        progress_manager.push_progress_sync(task_id, result)
        return result
    except Exception as e:
        err_msg = str(e)
        progress_manager.push_progress_sync(task_id, {
            "task_id": task_id,
            "status": "error",
            "progress": 0,
            "error": err_msg,
            "message": f"Gagal mengunduh lagu: {err_msg}"
        })
        return {"task_id": task_id, "status": "error", "error": err_msg}

def run_generic_download_sync(url: str, output_dir: str, task_id: str, format_choice: str = "mp4", label: str = "media") -> Dict[str, Any]:
    try:
        filename = download_generic_media(url, output_dir, task_id, format_choice, label)
        file_path = os.path.join(output_dir, filename)
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

        result = {
            "task_id": task_id,
            "status": "completed",
            "progress": 100.0,
            "speed": "0 MB/s",
            "eta": "0s",
            "filename": filename,
            "file_size": file_size,
            "download_url": f"/api/download/file/{filename}",
            "message": f"Unduhan {label.upper()} berhasil diselesaikan!"
        }
        progress_manager.push_progress_sync(task_id, result)
        return result
    except Exception as e:
        err_msg = str(e)
        progress_manager.push_progress_sync(task_id, {
            "task_id": task_id,
            "status": "error",
            "progress": 0,
            "error": err_msg,
            "message": f"Gagal mengunduh: {err_msg}"
        })
        return {"task_id": task_id, "status": "error", "error": err_msg}

def dispatch_task(task_type: str, params: dict, use_celery: bool = False):
    if task_type == "tiktok":
        return executor.submit(
            run_tiktok_download_sync,
            params["url"], params["output_dir"], params["task_id"], params.get("format_choice", "mp4")
        )
    elif task_type == "spotify":
        return executor.submit(
            run_spotify_download_sync,
            params["url"], params["output_dir"], params["task_id"]
        )
    elif task_type in ("youtube", "instagram", "generic"):
        return executor.submit(
            run_generic_download_sync,
            params["url"], params["output_dir"], params["task_id"], params.get("format_choice", "mp4"), task_type
        )
