import requests
import json
import os

# Configuration
API_URL = 'http://localhost:8000/api/create_video'
SLIDES_JSON_PATH = '/Users/danielgeorge/Documents/work/random/hackathon/paper-to-lecture/experiments/example_slides.json'
VOICEOVER_MP3_PATH = '/Users/danielgeorge/Documents/work/random/hackathon/paper-to-lecture/experiments/new_short_mp3.mov'

def main():
    # Check if slides JSON file exists
    if not os.path.exists(SLIDES_JSON_PATH):
        print(f"Slides JSON file not found at: {SLIDES_JSON_PATH}")
        return

    # Check if voiceover MP3 file exists
    if not os.path.exists(VOICEOVER_MP3_PATH):
        print(f"Voiceover MP3 file not found at: {VOICEOVER_MP3_PATH}")
        return

    # Load slides data to determine the number of slides
    with open(SLIDES_JSON_PATH, 'r') as f:
        try:
            slides_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {SLIDES_JSON_PATH}: {e}")
            return

    num_slides = len(slides_data)
    print(f"Number of slides to upload: {num_slides}")

    # Prepare the multipart form data
    files = []

    # Add the slides JSON file
    try:
        slides_file = open(SLIDES_JSON_PATH, 'rb')
        files.append(
            ('slides', ('example_slides.json', slides_file, 'application/json'))
        )
    except Exception as e:
        print(f"Error opening slides JSON file: {e}")
        return

    # Add the voiceover MP3 files (same file for each slide)
    try:
        with open(VOICEOVER_MP3_PATH, 'rb') as voiceover_file:
            voiceover_content = voiceover_file.read()
            for i in range(num_slides):
                # Create a tuple for each voiceover file
                # Name each file uniquely to avoid overwriting
                files.append(
                    ('voiceovers', (
                        f'voiceover_{i+1}.mp3',
                        voiceover_content,
                        'audio/mpeg'
                    ))
                )
    except Exception as e:
        print(f"Error reading voiceover MP3 file: {e}")
        slides_file.close()
        return

    # Send the POST request
    try:
        print("Sending POST request to create video...")
        response = requests.post(API_URL, files=files)
    except requests.exceptions.RequestException as e:
        print(f"Error making POST request: {e}")
        slides_file.close()
        return
    finally:
        # Close the slides file
        slides_file.close()

    # Handle the response
    if response.status_code == 200:
        try:
            response_data = response.json()
            video_url = response_data.get('video_url')
            if video_url:
                print("Video created successfully!")
                print(f"Video URL: {video_url}")
            else:
                print("Video URL not found in the response.")
        except json.JSONDecodeError:
            print("Failed to decode JSON response.")
            print("Response Text:", response.text)
    else:
        print(f"Failed to create video. Status Code: {response.status_code}")
        try:
            error_detail = response.json().get('detail', 'No detail provided.')
            print(f"Error Detail: {error_detail}")
        except json.JSONDecodeError:
            print("Response Text:", response.text)

if __name__ == "__main__":
    main()