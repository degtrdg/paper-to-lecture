1. **Set Up a Google Cloud Project**
2. **Enable the YouTube Data API**
3. **Create OAuth 2.0 Credentials**
4. **Install Required Python Libraries**
5. **Prepare the `client_secrets.json` File**
6. **Create the Upload Script**
7. **Set Up a Web Server Endpoint (Optional)**
8. **Test the Upload Functionality**

---

### **1. Set Up a Google Cloud Project**

First, you need to create a project in the Google Cloud Console.

- **Visit the [Google Cloud Console](https://console.cloud.google.com/).**
- **Create a New Project:**
  - Click on the project dropdown at the top of the page.
  - Select "New Project."
  - Give your project a name (e.g., "YouTubeUploadProject").
  - Click "Create."

### **2. Enable the YouTube Data API**

- **Navigate to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard).**
- **Enable the API:**
  - Click on "+ ENABLE APIS AND SERVICES" at the top.
  - Search for "YouTube Data API v3."
  - Click on it, then click "Enable."

### **3. Create OAuth 2.0 Credentials**

- **Go to the [Credentials Page](https://console.cloud.google.com/apis/credentials).**
- **Configure OAuth Consent Screen:**

  - Click on "OAuth consent screen" on the left menu.
  - Choose "External" if prompted (since you're the only user, it won't be published externally).
  - Fill in the required fields (App name, User support email).
  - Under "Scopes," you can skip adding scopes for now.
  - Save and continue through the steps until you finish.

- **Create Credentials:**
  - Click on "Create Credentials" at the top.
  - Select "OAuth client ID."
  - Choose "Desktop app" as the application type.
  - Give it a name (e.g., "YouTubeUploaderApp").
  - Click "Create."
  - **Download the `client_secrets.json` File:**
    - After creation, you'll see a dialog with your client ID and client secret.
    - Click "Download JSON" and save the file as `client_secrets.json`.
    - Place this file in the same directory where your script will reside.

### **4. Install Required Python Libraries**

Make sure you have Python 3 installed. Then, install the necessary libraries using `pip`.

```bash
pip install --upgrade google-api-python-client oauth2client httplib2
```

### **5. Prepare the `client_secrets.json` File**

Ensure your `client_secrets.json` file looks like this:

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
  }
}
```

**Note:** Replace `"YOUR_CLIENT_ID"` and `"YOUR_CLIENT_SECRET"` with the values from your OAuth 2.0 credentials.

### **6. Create the Upload Script**

Here's a simplified version of the script you provided, updated for Python 3, and with error handling:

```python
import os
import sys
import time
import random

import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
CLIENT_SECRETS_FILE = "client_secrets.json"

def get_authenticated_service():
    flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, SCOPES)
    credentials = flow.run_console()
    return googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials)

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
    video_file = "path_to_your_video.mp4"
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
```

**Notes:**

- Replace `"path_to_your_video.mp4"` with the actual path to your MP4 file.
- Update the `options` dictionary with your desired video metadata.
- The script uses `google-auth-oauthlib` for authentication, which is the recommended way as `oauth2client` is deprecated.
