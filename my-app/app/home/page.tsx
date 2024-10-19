'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Video, Home, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [linkEntered, setLinkEntered] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const topRef = useRef<HTMLDivElement>(null)

  const handleLinkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('pdfUrl') as HTMLInputElement
    if (input.value.endsWith('.pdf')) {
      setPdfUrl(input.value)
      setLinkEntered(true)
      setShowNext(true)
    } else {
      alert('Please enter a valid PDF URL')
    }
  }

  const handleNext = () => {
    setShowVideo(true)
    setLinkEntered(false)
    setShowNext(false)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <motion.div
        className="bg-muted"
        initial={{ width: sidebarOpen ? 250 : 60 }}
        animate={{ width: sidebarOpen ? 250 : 60 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-4"
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
          <nav className="space-y-2">
            <Link href="/" className="flex items-center space-x-2 text-primary">
              <Home size={20} />
              {sidebarOpen && <span>Home</span>}
            </Link>
            <Link href="/videos" className="flex items-center space-x-2 text-muted-foreground">
              <Video size={20} />
              {sidebarOpen && <span>Videos</span>}
            </Link>
            <Link href="/settings" className="flex items-center space-x-2 text-muted-foreground">
              <Settings size={20} />
              {sidebarOpen && <span>Settings</span>}
            </Link>
          </nav>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div ref={topRef} className="max-w-3xl mx-auto text-center">
          <motion.div
            className="relative w-32 h-32 mx-auto mb-8"
            animate={{ rotate: showVideo ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse animation-delay-500"></div>
            <div className="absolute inset-8 bg-primary/15 rounded-full animate-pulse animation-delay-1000"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {showVideo ? (
                <Video className="w-16 h-16 text-primary" />
              ) : (
                <BookOpen className="w-16 h-16 text-primary" />
              )}
            </div>
          </motion.div>

          {!showVideo && (
            <>
              <h1 className="text-4xl font-bold mb-4">Welcome to LectureGen</h1>
              <p className="text-xl mb-8 text-muted-foreground">
                Transform your research papers into engaging video lectures
              </p>

              {!linkEntered ? (
                <form onSubmit={handleLinkSubmit} className="mb-8">
                  <div className="flex space-x-2">
                    <Input
                      type="url"
                      name="pdfUrl"
                      placeholder="Enter PDF URL (must end with .pdf)"
                      className="flex-grow"
                      required
                    />
                    <Button type="submit">Generate</Button>
                  </div>
                </form>
              ) : (
                <div className="mb-8">
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <h2 className="text-lg font-semibold mb-2">PDF Preview</h2>
                    <div className="aspect-[3/4] bg-background rounded-md overflow-hidden">
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                  {showNext && (
                    <Button onClick={handleNext}>Next</Button>
                  )}
                </div>
              )}
            </>
          )}

          {showVideo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-4">Generating Video Lecture</h2>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
