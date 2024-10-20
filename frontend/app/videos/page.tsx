'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from '@/utils/supabase/client'

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  link: string;
  created_at: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])

  useEffect(() => {
    const fetchVideos = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching videos:', error)
      } else {
        const processedVideos = data.map(processVideo)
        setVideos(processedVideos)
      }
    }

    fetchVideos()
  }, [])

  const processVideo = (video: any): VideoItem => {
    console.log(video)  
    if (video.video_link && (video.video_link.includes('youtube.com') || video.video_link.includes('youtu.be'))) {
      const videoId = extractYouTubeId(video.video_link)
      console.log(videoId)
      return {
        id: video.id,
        title: `YouTube Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
        link: video.link,
        created_at: video.created_at
      }
    } else {
      return {
        id: video.id,
        title: 'Variational Autoencoder For Cancer Diagnosis',
        thumbnail: '/placeholder-audio.png',  
        link: video.link || '',
        created_at: video.created_at
      }
    }
  }

  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    console.log(match)
    return (match && match[2].length === 11) ? match[2] : ''
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Videos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="group relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl">
            <CardContent className="p-4">
              <div className="relative aspect-video mb-4">
                <Image
                  src={video.thumbnail}
                  alt={`Thumbnail for ${video.title}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Video className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
              <div className="text-sm text-muted-foreground">
                Created: {new Date(video.created_at).toLocaleDateString()}
              </div>
            </CardContent>
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button asChild variant="secondary" size="sm" className="flex items-center">
                <Link href={`/videos/viewer?id=${video.id}`}>
                  Watch Video <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
