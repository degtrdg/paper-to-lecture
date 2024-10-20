'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic } from "lucide-react"

// Mock API response for chapters
const mockChapters = [
  { timestamp: 0, name: "Introduction" },
  { timestamp: 120, name: "Chapter 1: Basic Concepts" },
  { timestamp: 300, name: "Chapter 2: Advanced Topics" },
  { timestamp: 480, name: "Conclusion" }
]

// Add this type definition at the top of your file
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: any) => YT["Player"];
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YT {
  Player: {
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
  };
}

export default function LectureViewer() {
  const [chapters, setChapters] = useState(mockChapters)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [notes, setNotes] = useState('')
  const playerRef = useRef<YT["Player"] | null>(null)

  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script')
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Initialize YouTube player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '360',
        width: '640',
        videoId: 'dQw4w9WgXcQ', // Replace with your actual video ID
      })
    }

    return () => {
    }
  }, [])


  const handleChapterChange = (direction: number) => {
    let newChapter = currentChapter + direction
    if (newChapter < 0) newChapter = 0
    if (newChapter >= chapters.length) newChapter = chapters.length - 1

    setCurrentChapter(newChapter)
    if (playerRef.current) {
      playerRef.current.seekTo(chapters[newChapter].timestamp)
    }
  }

  const handleMicClick = () => {
    // Implement microphone functionality here
    console.log("Microphone clicked")
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <Button 
          onClick={() => handleChapterChange(-1)} 
          disabled={currentChapter === 0}
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
        <div id="youtube-player"></div>
      </div>
      
      <div className="flex gap-4">
        <Button 
          size="icon" 
          className="rounded-full w-12 h-12"
          onClick={handleMicClick}
        >
          <Mic className="h-6 w-6" />
        </Button>
        <Textarea 
          placeholder="Take notes here..." 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          className="flex-grow"
          rows={4}
        />
      </div>
    </div>
  )
}
