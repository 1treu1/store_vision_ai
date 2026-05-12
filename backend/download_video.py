import yt_dlp
import os

def download_video(url, output_path="video_test.mp4"):
    ydl_opts = {
        'format': 'best[height<=720][ext=mp4]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'noplaylist': True,
    }
    
    print(f"Iniciando descarga de: {url}")
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"\n¡Descarga completada! El archivo se guardó como: {output_path}")
    except Exception as e:
        print(f"\nError al descargar: {e}")

if __name__ == "__main__":
    youtube_url = "https://www.youtube.com/watch?v=PR9P6EgqkZE"
    download_video(youtube_url)
