import os
import sys
import time
import random

import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
CLIENT_SECRETS_FILE = "/Users/danielgeorge/Documents/work/random/hackathon/paper-to-lecture/experiments/client_secret.json"
TOKEN_FILE = "token.json"

def get_authenticated_service():
    creds = None
    # Check if token.json exists
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    # If there are no valid credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRETS_FILE, SCOPES)
            creds = flow.run_console()
        # Save the credentials for the next run
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    return googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=creds)

def upload_video(youtube, options):
    body = {
        "snippet": {
            "title": options["title"],
            "description": options["description"],
            "tags": options.get("tags"),
            "categoryId": options.get("categoryId", "22")
        },
        "status": {
            "privacyStatus": options.get("privacyStatus", "private")
        }
    }

    media = MediaFileUpload(options["file"], chunksize=-1, resumable=True)

    request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=media
    )

    response = None
    while response is None:
        try:
            print("Uploading video...")
            status, response = request.next_chunk()
            if response:
                print(f"Video uploaded successfully. Video ID: {response['id']}")
        except googleapiclient.errors.HttpError as e:
            if e.resp.status in [500, 502, 503, 504]:
                print(f"Retriable error occurred: {e}")
                time.sleep(random.uniform(1, 5))
            else:
                print(f"An error occurred: {e}")
                break

if __name__ == "__main__":
    video_file = "/Users/danielgeorge/Documents/work/random/hackathon/paper-to-lecture/experiments/Rick Astley - Never Gonna Give You Up (Official Music Video).mp4"
    options = {
        "file": video_file,
        "title": "Test Video Upload",
        "description": "This is a test video upload via YouTube Data API",
        "tags": ["test", "api", "upload"],
        "categoryId": "22",
        "privacyStatus": "private"
    }

    if not os.path.exists(video_file):
        print("File does not exist.")
        sys.exit(1)

    youtube = get_authenticated_service()
    try:
        upload_video(youtube, options)
    except Exception as e:
        print(f"An error occurred: {e}")
