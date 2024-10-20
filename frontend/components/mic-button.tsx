'use client';

import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

export default function MicButton() {
  const { connect, disconnect, readyState } = useVoice();

  const handleMicClick = () => {
    if (readyState === VoiceReadyState.OPEN) {
      disconnect();
    } else {
      connect()
        .then(() => {
          console.log("Connected to Hume EVI");
        })
        .catch((error) => {
          console.error("Failed to connect:", error);
        });
    }
  };

  return (
    <Button 
      size="icon" 
      className="rounded-full w-12 h-12"
      onClick={handleMicClick}
    >
      {readyState === VoiceReadyState.OPEN ? (
        <MicOff className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
}