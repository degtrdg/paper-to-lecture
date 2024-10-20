// @ts-nocheck

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff } from "lucide-react";
import { VoiceProvider, useVoice, VoiceReadyState } from "@humeai/voice-react";
import { fetchAccessToken } from "hume";
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const mockChapters = [
  { timestamp: 0, name: "Introduction" },
  { timestamp: 120, name: "Chapter 1: Basic Concepts" },
  { timestamp: 300, name: "Chapter 2: Advanced Topics" },
  { timestamp: 480, name: "Conclusion" }
];

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: any) => YT['Player'];
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YT {
  Player: {
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
  };
}

const loadYouTubeAPI = () => {
  return new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      console.log("YouTube API already loaded");
      resolve();
    } else {
      console.log("Loading YouTube API");
      const tag = document.createElement('script');
      tag.src = `https://www.youtube.com/iframe_api?_=${Date.now()}`;
      tag.onload = () => {
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API loaded successfully");
          resolve();
        };
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  });
};

export default function LectureViewer() {
  const [chapters, setChapters] = useState(mockChapters);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [notes, setNotes] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const youtubeAPILoaded = useRef(false);
  const playerRef = useRef<YT['Player'] | null>(null);
  const HUME_API_KEY = process.env.NEXT_PUBLIC_HUME_API_KEY ?? '';
  const HUME_SECRET_KEY = process.env.NEXT_PUBLIC_HUME_SECRET_KEY ?? '';
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const videoId = searchParams.get('id');
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        if (!HUME_API_KEY || !HUME_SECRET_KEY) {
          throw new Error('Hume API keys are not set');
        }
        const token = await fetchAccessToken({
          apiKey: HUME_API_KEY,
          secretKey: HUME_SECRET_KEY,
        });

        if (token) {
          setAccessToken(token);
        } else {
          console.error("Failed to fetch access token");
        }
      } catch (error) {
        console.error("Failed to fetch access token:", error);
      }
    };

    getToken();

    const initializePlayer = async () => {
      if (!youtubeAPILoaded.current) {
        await loadYouTubeAPI();
        youtubeAPILoaded.current = true;
      }

      if (!playerRef.current && playerContainerRef.current) {
        console.log("Initializing YouTube player");
        const playerElement = document.createElement('div');
        playerElement.id = 'youtube-player';
        playerContainerRef.current.appendChild(playerElement);

        playerRef.current = new window.YT.Player('youtube-player', {
          height: '360',
          width: '640',
          videoId: '',
          events: {
            onReady: (event: any) => {
              console.log("YouTube player is ready");
              setIsPlayerReady(true);
            },
            onError: (event: any) => {
              console.error("YouTube player error:", event.data);
            }
          }
        });
      }
    };

    initializePlayer();

    const fetchVideoUrl = async () => {
      if (!videoId) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('videos')
        .select('video_link')
        .eq('id', videoId)
        .single();

      if (error) {
        console.error('Error fetching video URL:', error);
      } else if (data) {
        console.log("Fetched video URL:", data.video_link);
        setVideoUrl(data.video_link);
      }
    };

    fetchVideoUrl();

    return () => {
      // Cleanup function
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (videoUrl && playerRef.current && isPlayerReady) {
      const embedId = extractYouTubeEmbedId(videoUrl);
      if (embedId) {
        console.log("Loading video with embed ID:", embedId);
        playerRef.current.loadVideoById(embedId);
      }
    }
  }, [videoUrl, isPlayerReady]);

  const extractYouTubeEmbedId = (url: string): string => {
    let videoId = '';
    
    // Handle youtube.com URLs
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?(.+)/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
      videoId = match[1].split('&')[0]; // Remove any additional parameters
    }
    
    // Handle youtu.be URLs
    const youtubeShortRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be)\/(.+)/;
    const shortMatch = url.match(youtubeShortRegex);
    
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    }

    // Generate the embed ID with the additional parameter
    const embedId = `${videoId}?si=IcRR1Xp9IZ-pvzdH`;

    console.log("Extracted embed ID:", embedId);
    return embedId;
  };

  const handleChapterChange = (direction: number) => {
    let newChapter = currentChapter + direction;
    if (newChapter < 0) newChapter = 0;
    if (newChapter >= chapters.length) newChapter = chapters.length - 1;

    setCurrentChapter(newChapter);
    if (playerRef.current) {
      playerRef.current.seekTo(chapters[newChapter].timestamp);
    }
  };
  const systemPrompt = `
  <voice_only_response_format>
    Everything you output will be spoken aloud with expressive text-to-speech, so tailor all of your responses for voice-only conversations. NEVER output text-specific formatting like markdown, lists, or anything that is not normally said out loud. Always prefer easily pronounced words. Seamlessly incorporate natural vocal inflections like “oh wow” and discourse markers like “I mean” to make your conversation human-like and to ease user comprehension. Stop talking as soon as you can because the user has a short attention span and very little patience.
  </voice_only_response_format>
  
  <role_description>
    You are a passionate and dedicated teacher committed to helping students understand the video lecture they are currently watching. Your responses should be clear, engaging, supportive, and concise. Encourage the student, provide thorough explanations, and adapt your teaching style to the student's needs and emotional state.
  </role_description>
  
  <respond_to_expressions>
    Carefully analyze the top 3 emotional expressions provided in brackets after the User's message. These expressions indicate the User's tone in the format: {expression1 confidence1, expression2 confidence2, expression3 confidence3}, e.g., {very happy, quite anxious, moderately amused}. The confidence score indicates how likely the User is expressing that emotion in their voice. Consider expressions and confidence scores to craft an empathic, appropriate response. Even if the User does not explicitly state it, infer the emotional context from expressions. For example:
    - If the User is “quite” confused, provide a clearer and more detailed explanation.
    - If the User is “very” engaged, offer more in-depth insights and encourage further exploration.
    - If the User is “extremely” frustrated, remain patient and supportive, and offer to clarify misunderstood concepts.
    Assistant NEVER outputs content in brackets; never use this format in your message; just use expressions to interpret tone.
  </respond_to_expressions>
  
  <detect_mismatches>
    Stay alert for incongruence between words and tone when the user's words do not match their expressions. Address these disparities out loud. For example, if the user says "I understand this" but their tone indicates confusion, respond with clarification. Always reply to sarcasm with funny, witty, sarcastic responses; do not be too serious.
  </detect_mismatches>
  
  <continue_instruction>
    If you see "[continue]" never ever go back on your words, don't say sorry, and make sure to discreetly pick up where you left off. For example:
    Assistant: Let's dive deeper into this topic!
    User: [continue]
    Assistant: Absolutely, here's more detail about that concept.
  </continue_instruction>
  `;

  const sessionSettings: SessionSettings = {
    type: "conversation",
    systemPrompt,
  };

  return (
    accessToken ? (
      <VoiceProvider auth={{ type: "accessToken", value: accessToken }} sessionSettings={sessionSettings}>
        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-4 flex justify-between items-center">
            <Button
              onClick={() => handleChapterChange(-1)}
              disabled={currentChapter === 0 || !isPlayerReady}
            >
              Previous Chapter
            </Button>
            <h2 className="text-xl font-bold">{chapters[currentChapter].name}</h2>
            <Button
              onClick={() => handleChapterChange(1)}
              disabled={currentChapter === chapters.length - 1}
            >
              Next Chapter
            </Button>
          </div>

          <div className="aspect-video mb-4 flex justify-center">
            <div ref={playerContainerRef} className="w-full h-full">
              {!isPlayerReady && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  Loading YouTube player...
                </div>
              )}
            </div>
          </div>

          <Messages />

          <div className="flex gap-4">
            <MicButton />
            <Textarea
              placeholder="Take notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-grow"
              rows={4}
            />
          </div>
        </div>
      </VoiceProvider>
    ) : (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    )
  );
}

function MicButton() {
  const { connect, disconnect, readyState } = useVoice();

  const handleMicClick = () => {
    if (readyState === VoiceReadyState.OPEN) {
      disconnect();
    } else {
      connect()
        .then(() => {
          console.log("Connected to Hume EVI");
        })
        .catch((error: any) => {
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

function Messages() {
  const { messages } = useVoice();

  return (
    <div className="my-4">
      {messages.map((msg: any, index: number) => {
        if (msg.type === "user_message" || msg.type === "assistant_message") {
          return (
            <div key={index} className="mb-2">
              <div
                className={`font-bold ${
                  msg.message.role === 'assistant' ? 'text-blue-500' : 'text-green-500'
                }`}
              >
                {msg.message.role === 'assistant' ? 'Hume' : 'You'}
              </div>
              <div>{msg.message.content}</div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
