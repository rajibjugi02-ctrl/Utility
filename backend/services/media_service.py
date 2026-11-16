import os
import uuid
import yt_dlp
from typing import Dict, Any
from .ffmpeg_helper import get_ffmpeg_binary
from .ws_manager import progress_manager

def get_media_metadata(url: str) -> Dict[str, Any]:
    ffmpeg_exe = get_ffmpeg_binary()
    ydl_opts = {
        'skip_download': True,
        'extract_flat': False,
        'quiet': True,
        'no_warnings': True,
    }
    if ffmpeg_exe:
        ydl_opts['ffmpeg_location'] = ffmpeg_exe

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            "title": info.get('title', 'Media Item'),
            "uploader": info.get('uploader') or info.get('channel') or 'Creator',
            "thumbnail": info.get('thumbnail', ''),
            "duration": info.get('duration', 0),
            "view_count": info.get('view_count', 0),
            "like_count": info.get('like_count', 0),
            "description": (info.get('description', '') or '')[:300],
        }

def download_generic_media(url: str, output_dir: str, task_id: str, format_choice: str = "mp4", label: str = "media") -> str:
    os.makedirs(output_dir, exist_ok=True)
    ffmpeg_exe = get_ffmpeg_binary()
    file_id = str(uuid.uuid4())[:12]
    output_template = os.path.join(output_dir, f"{label}_{file_id}.%(ext)s")

    def progress_hook(d):
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 1
            downloaded = d.get('downloaded_bytes', 0)
            percentage = round((downloaded / total) * 100, 1) if total else 0
            
            speed_val = d.get('speed')
            speed_str = f"{(speed_val / (1024 * 1024)):.2f} MB/s" if speed_val else "Calculating..."
            
            eta_val = d.get('eta')
            eta_str = f"{int(eta_val)}s" if eta_val is not None else "--:--"

            progress_manager.push_progress_sync(task_id, {
                "task_id": task_id,
                "status": "downloading",
                "progress": min(percentage, 99.0),
                "speed": speed_str,
                "eta": eta_str,
                "message": f"Mengunduh stream {label.upper()}..."
            })
        elif d['status'] == 'finished':
            progress_manager.push_progress_sync(task_id, {
                "task_id": task_id,
                "status": "processing",
                "progress": 99.0,
                "speed": "0 MB/s",
                "eta": "0s",
                "message": "Mengonversi dan menyelesaikan berkas..."
            })

    ydl_opts: Dict[str, Any] = {
        'outtmpl': output_template,
        'progress_hooks': [progress_hook],
        'quiet': True,
        'no_warnings': True,
    }

    if ffmpeg_exe:
        ydl_opts['ffmpeg_location'] = ffmpeg_exe

    if format_choice == "mp3":
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }],
        })
    else:
        ydl_opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    for fname in os.listdir(output_dir):
        if fname.startswith(f"{label}_{file_id}"):
            return fname

    raise FileNotFoundError("Gagal menemukan file hasil unduhan.")
