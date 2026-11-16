import os
import re
import uuid
import yt_dlp
from typing import Dict, List, Any
from .ffmpeg_helper import get_ffmpeg_binary
from .ws_manager import progress_manager

# Regex patterns for Alight Motion and related preset links
PRESET_PATTERNS = [
    r'https?://(?:www\.)?alight\.link/[a-zA-Z0-9_\-]+',
    r'https?://(?:www\.)?alightcreative\.com/[a-zA-Z0-9_\-/?=]+',
    r'https?://drive\.google\.com/file/d/[a-zA-Z0-9_\-]+[^\s]*',
    r'https?://(?:www\.)?mediafire\.com/file/[a-zA-Z0-9_\-]+/[^\s]+',
    r'https?://(?:www\.)?dropbox\.com/s/[a-zA-Z0-9_\-]+/[^\s]+',
]

def extract_preset_links(text: str) -> List[Dict[str, str]]:
    if not text:
        return []
    
    found: List[Dict[str, str]] = []
    seen = set()

    for pattern in PRESET_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            clean_url = m.rstrip('.,;)"\'')
            if clean_url not in seen:
                seen.add(clean_url)
                service = "Alight Motion"
                if "drive.google.com" in clean_url:
                    service = "Google Drive (XML Preset)"
                elif "mediafire.com" in clean_url:
                    service = "MediaFire (XML Preset)"
                elif "dropbox.com" in clean_url:
                    service = "Dropbox"
                found.append({
                    "url": clean_url,
                    "service": service,
                    "type": "preset"
                })

    return found

def get_tiktok_metadata(url: str) -> Dict[str, Any]:
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
        description = info.get('description', '') or ''
        title = info.get('title', '') or ''
        
        # Combine title and description to detect preset links
        combined_text = f"{title}\n{description}"
        presets = extract_preset_links(combined_text)

        # Extract comments if available
        comments = info.get('comments', []) or []
        for c in comments:
            c_text = c.get('text', '')
            presets.extend(extract_preset_links(c_text))
            
        # Deduplicate presets
        unique_presets = []
        seen = set()
        for p in presets:
            if p['url'] not in seen:
                seen.add(p['url'])
                unique_presets.append(p)

        return {
            "title": title or "TikTok Video",
            "author": info.get('uploader', 'Unknown Creator'),
            "author_id": info.get('uploader_id', ''),
            "thumbnail": info.get('thumbnail', ''),
            "duration": info.get('duration', 0),
            "view_count": info.get('view_count', 0),
            "like_count": info.get('like_count', 0),
            "presets_found": len(unique_presets) > 0,
            "presets": unique_presets,
            "description": description
        }

def download_tiktok_video(url: str, output_dir: str, task_id: str, format_choice: str = "mp4") -> str:
    os.makedirs(output_dir, exist_ok=True)
    ffmpeg_exe = get_ffmpeg_binary()
    file_id = str(uuid.uuid4())[:12]
    output_template = os.path.join(output_dir, f"tiktok_{file_id}.%(ext)s")

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
                "message": "Mengunduh stream video TikTok..."
            })
        elif d['status'] == 'finished':
            progress_manager.push_progress_sync(task_id, {
                "task_id": task_id,
                "status": "processing",
                "progress": 99.0,
                "speed": "0 MB/s",
                "eta": "0s",
                "message": "Finalisasi berkas..."
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
        # Standard best MP4
        ydl_opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # Find the resulting file
    for fname in os.listdir(output_dir):
        if fname.startswith(f"tiktok_{file_id}"):
            return fname

    raise FileNotFoundError("Gagal menemukan file hasil unduhan.")
