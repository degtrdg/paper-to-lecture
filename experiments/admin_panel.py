import os
import asyncio
from supabase import create_client, Client
from youtube_upload import get_authenticated_service, upload_video

# Load environment variables or define them here
from dotenv import load_dotenv

load_dotenv("/Users/danielgeorge/Documents/work/random/hackathon/paper-to-lecture/experiments/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
DATABASE_TABLE = "videos"  # The table to listen to

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)

async def handle_new_video(payload):
    """
    Handle new video entry from Supabase and upload to YouTube.

    Args:
        payload (dict): The payload received from Supabase.
    """
    try:
        new_record = payload['record']
        video_url = new_record['video_url']
        title = new_record.get('title', 'Untitled Video')
        description = new_record.get('description', '')
        tags = new_record.get('tags', [])
        category_id = new_record.get('category_id', '22')
        privacy_status = new_record.get('privacy_status', 'private')

        # Download the video from the URL
        video_path = download_video(video_url)

        if not video_path:
            print("Failed to download video.")
            return

        # Prepare upload options
        options = {
            "file": video_path,
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,
            "privacyStatus": privacy_status
        }

        # Authenticate and upload
        youtube = get_authenticated_service()
        upload_video(youtube, options)

    except Exception as e:
        print(f"Error handling new video: {e}")

def download_video(video_url):
    """
    Download video from the given URL to the local static folder.

    Args:
        video_url (str): The URL of the video to download.

    Returns:
        str: Path to the downloaded video file.
    """
    try:
        import requests
        from urllib.parse import urlparse, unquote
        from pathlib import Path

        response = requests.get(video_url, stream=True)
        response.raise_for_status()

        # Extract filename from URL
        parsed_url = urlparse(video_url)
        filename = Path(unquote(os.path.basename(parsed_url.path))).name
        video_path = os.path.join("static", filename)

        with open(video_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return video_path

    except Exception as e:
        print(f"Error downloading video: {e}")
        return None

async def listen_to_supabase():
    """
    Listen to Supabase Realtime and handle new video entries.
    """
    try:
        connection = supabase.realtime.subscribe(DATABASE_TABLE, event_handler=handle_new_video)
        print("Listening to Supabase Realtime events...")
        # Keep the listener running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down listener...")
    finally:
        supabase.realtime.unsubscribe(connection)

if __name__ == "__main__":
    asyncio.run(listen_to_supabase())