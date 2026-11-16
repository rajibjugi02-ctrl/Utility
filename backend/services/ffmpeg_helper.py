import os
import shutil

def get_ffmpeg_binary() -> str | None:
    # First check if ffmpeg is in system PATH
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    
    # Fallback to imageio-ffmpeg bundled binary
    try:
        import imageio_ffmpeg
        exe_path = imageio_ffmpeg.get_ffmpeg_exe()
        if exe_path and os.path.exists(exe_path):
            return exe_path
    except ImportError:
        pass

    return None

def get_ffprobe_binary() -> str | None:
    system_ffprobe = shutil.which("ffprobe")
    if system_ffprobe:
        return system_ffprobe
    
    # imageio_ffmpeg provides ffmpeg, let's see if directory has ffprobe
    ffmpeg = get_ffmpeg_binary()
    if ffmpeg:
        dir_name = os.path.dirname(ffmpeg)
        probe_candidate = os.path.join(dir_name, "ffprobe.exe" if os.name == "nt" else "ffprobe")
        if os.path.exists(probe_candidate):
            return probe_candidate

    return None
