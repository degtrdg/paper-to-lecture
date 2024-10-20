import asyncio
import os
from dotenv import load_dotenv
from hume import AsyncHumeClient, Stream, MicrophoneInterface
from hume.empathic_voice.chat.socket_client import ChatConnectOptions, ChatWebsocketConnection
import base64
import sounddevice as sd
import numpy as np

class WebSocketInterface:
    def __init__(self):
        self.socket = None
        self.byte_strs = Stream(asyncio.Queue(), self._stream_generator())
    
    async def _stream_generator(self):
        while True:
            yield await self.byte_strs.queue.get()
    
    def set_socket(self, socket: ChatWebsocketConnection):
        self.socket = socket
    
    async def on_open(self):
        print("WebSocket connection opened")
    
    async def on_message(self, data):
        event_type = data.type
        if event_type == "audio_output":
            audio_data = getattr(data, 'data', None) or getattr(data.payload, 'data', None)
            if audio_data:
                await self.play_audio(audio_data)
            else:
                print(f"Unexpected audio_output structure: {data}")
        elif event_type == "transcript":
            text = getattr(data, 'text', None) or getattr(data.payload, 'text', None)
            if text:
                print(f"Assistant: {text}")
            else:
                print(f"Unexpected transcript structure: {data}")
        elif event_type == "error":
            message = getattr(data, 'message', None) or getattr(data.payload, 'message', None)
            if message:
                print(f"Error: {message}")
            else:
                print(f"Unexpected error structure: {data}")
        elif event_type == "chat_metadata":
            print(f"Chat session started: {data.chat_id}")
        elif event_type == "user_message":
            print(f"User: {getattr(data, 'text', data)}")
        elif event_type == "assistant_message":
            print("Assistant is responding...")
        elif event_type == "assistant_end":
            print("Assistant finished responding.")
        else:
            print(f"Received unknown event type: {event_type}")
    
    async def on_close(self):
        print("WebSocket connection closed")
    
    async def on_error(self, error: Exception):
        print(f"WebSocket error: {error}")
    
    async def play_audio(self, audio_data):
        decoded_audio = base64.b64decode(audio_data)
        audio_array = np.frombuffer(decoded_audio, dtype=np.int16)
        sd.play(audio_array, samplerate=16000)
        sd.wait()

async def main():
    load_dotenv()
    HUME_API_KEY = os.getenv("HUME_API_KEY")
    HUME_SECRET_KEY = os.getenv("HUME_SECRET_KEY")
    HUME_CONFIG_ID = os.getenv("HUME_CONFIG_ID")

    client = AsyncHumeClient(api_key=HUME_API_KEY)
    websocket_interface = WebSocketInterface()

    options = ChatConnectOptions(config_id=HUME_CONFIG_ID, secret_key=HUME_SECRET_KEY)

    async with client.empathic_voice.chat.connect_with_callbacks(
        options=options,
        on_open=websocket_interface.on_open,
        on_message=websocket_interface.on_message,
        on_close=websocket_interface.on_close,
        on_error=websocket_interface.on_error
    ) as socket:
        websocket_interface.set_socket(socket)

        print("You can start talking now. Press Ctrl+C to exit.")

        try:
            while True:
                # Start the MicrophoneInterface to capture and send audio
                microphone_task = asyncio.create_task(MicrophoneInterface.start(
                    socket,
                    byte_stream=websocket_interface.byte_strs,
                    allow_user_interrupt=True
                ))
                await microphone_task
        except KeyboardInterrupt:
            print("Exiting...")

if __name__ == "__main__":
    asyncio.run(main())
