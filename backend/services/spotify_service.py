import os
import re
import uuid
import requests
import yt_dlp
from typing import Dict, Any
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1, TALB, APIC, ID3NoHeaderError
from .ffmpeg_helper import get_ffmpeg_binary
from .ws_manager import progress_manager

def get_spotify_metadata(url: str) -> Dict[str, Any]:
    # Extract track ID
    track_id_match = re.search(r'track/([a-zA-Z0-9]+)', url)
    track_id = track_id_match.group(1) if track_id_match else None
    
    clean_url = f"https://open.spotify.com/track/{track_id}" if track_id else url
    oembed_url = f"https://open.spotify.com/oembed?url={clean_url}"
    
    title = "Spotify Track"
    artist = "Unknown Artist"
    album = "Single"
    cover_url = ""
    
    try:
        resp = requests.get(oembed_url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            # Title format often "Title by Artist" or just "Title"
            raw_title = data.get('title', '')
            cover_url = data.get('thumbnail_url', '')
            if " by " in raw_title:
                parts = raw_title.split(" by ")
                title = parts[0].strip()
                artist = parts[1].strip()
            else:
                title = raw_title.strip()
    except Exception as e:
        print(f"Error querying Spotify oEmbed: {e}")

    # Fallback/enrich from HTML meta tags
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        page = requests.get(clean_url, headers=headers, timeout=10).text
        # og:title
        og_title = re.search(r'<meta property="og:title" content="([^"]+)"', page)
        if og_title and not title:
            title = og_title.group(1)
        # og:description e.g., "Song · Artist · Year"
        og_desc = re.search(r'<meta property="og:description" content="([^"]+)"', page)
        if og_desc:
            desc = og_desc.group(1)
            parts = [p.strip() for p in desc.split('·')]
            if len(parts) >= 2 and artist == "Unknown Artist":
                artist = parts[1]
            if len(parts) >= 3:
                album = parts[2]
        # og:image
        og_img = re.search(r'<meta property="og:image" content="([^"]+)"', page)
        if og_img and not cover_url:
            cover_url = og_img.group(1)
    except Exception:
        pass

    return {
        "title": title,
        "artist": artist,
        "album": album,
        "cover_url": cover_url,
        "source_url": clean_url
    }

def inject_mp3_metadata(mp3_path: str, title: str, artist: str, album: str, cover_url: str):
    try:
        try:
            audio = ID3(mp3_path)
        except ID3NoHeaderError:
            audio = ID3()

        # Add text tags
        audio.add(TIT2(encoding=3, text=title))
        audio.add(TPE1(encoding=3, text=artist))
        audio.add(TALB(encoding=3, text=album))

        # Fetch and attach cover art
        if cover_url:
            try:
                img_data = requests.get(cover_url, timeout=10).content
                mime_type = 'image/jpeg' if 'jpeg' in cover_url.lower() or 'jpg' in cover_url.lower() else 'image/png'
                audio.add(APIC(
                    encoding=3,
                    mime=mime_type,
                    type=3,  # Front cover
                    desc='Cover',
                    data=img_data
                ))
            except Exception as e:
                print(f"Failed to attach cover image: {e}")

        audio.save(mp3_path)
    except Exception as e:
        print(f"Error during ID3 injection: {e}")

def download_spotify_to_mp3(url: str, output_dir: str, task_id: str) -> Dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)
    metadata = get_spotify_metadata(url)
    search_query = f"ytsearch1:{metadata['artist']} - {metadata['title']} audio"

    progress_manager.push_progress_sync(task_id, {
        "task_id": task_id,
        "status": "searching",
        "progress": 10.0,
        "speed": "0 MB/s",
        "eta": "--:--",
        "message": f"Mencari audio untuk: {metadata['artist']} - {metadata['title']}..."
    })

    file_id = str(uuid.uuid4())[:12]
    output_template = os.path.join(output_dir, f"spotify_{file_id}.%(ext)s")
    ffmpeg_exe = get_ffmpeg_binary()

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
                "progress": min(10 + (percentage * 0.8), 90.0),
                "speed": speed_str,
                "eta": eta_str,
                "message": "Mengunduh stream audio kualitas tinggi..."
            })
        elif d['status'] == 'finished':
            progress_manager.push_progress_sync(task_id, {
                "task_id": task_id,
                "status": "processing",
                "progress": 92.0,
                "speed": "0 MB/s",
                "eta": "0s",
                "message": "Mengkonversi ke format MP3 320kbps..."
            })

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'progress_hooks': [progress_hook],
        'quiet': True,
        'no_warnings': True,
    }

    if ffmpeg_exe:
        ydl_opts['ffmpeg_location'] = ffmpeg_exe

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([search_query])

    mp3_filename = f"spotify_{file_id}.mp3"
    full_mp3_path = os.path.join(output_dir, mp3_filename)

    if not os.path.exists(full_mp3_path):
        # Look for matching file if extension differs
        for fname in os.listdir(output_dir):
            if fname.startswith(f"spotify_{file_id}"):
                mp3_filename = fname
                full_mp3_path = os.path.join(output_dir, fname)
                break

    # Inject ID3 tags & Album art
    progress_manager.push_progress_sync(task_id, {
        "task_id": task_id,
        "status": "processing",
        "progress": 96.0,
        "speed": "0 MB/s",
        "eta": "0s",
        "message": "Menyuntikkan cover album & ID3 metadata..."
    })

    inject_mp3_metadata(
        full_mp3_path,
        title=metadata['title'],
        artist=metadata['artist'],
        album=metadata['album'],
        cover_url=metadata['cover_url']
    )

    return {
        "filename": mp3_filename,
        "title": metadata['title'],
        "artist": metadata['artist'],
        "album": metadata['album'],
        "cover_url": metadata['cover_url']
    }
