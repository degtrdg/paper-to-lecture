'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Video } from "lucide-react"
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

const statusMessages = [
  'No job in progress',
  'Extracting info',
  'Extracting text',
  'Summarizing',
  'Structuring slides',
  'Creating slides',
  'Exporting slides',
  'Creating audio',
  'Splicing video'
]

export default function HomePage() {
  const [jobStatus, setJobStatus] = useState(0)
  const [pdfUrl, setPdfUrl] = useState('')
  const [linkEntered, setLinkEntered] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchUserAndJob = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log("user id",  user?.id)
      if (user) {
        setUser(user)
        const { data, error } = await supabase
          .from('jobs')
          .select('status')
          .eq('user_id', user.id)
          .single()

        if (data) {
          setJobStatus(data.status)
        }
      } else {
        // Redirect to sign-in page if user is not authenticated
        router.push('/sign-in')
      }
    }

    fetchUserAndJob()

    const channel = supabase.channel('jobs')
    
    channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        (payload) => {
          setJobStatus(payload.new.status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const handleLinkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('pdfUrl') as HTMLInputElement
    if (input.value.endsWith('.pdf')) {
      setPdfUrl(input.value)
      setLinkEntered(true)
    } else {
      alert('Please enter a valid PDF URL')
    }
  }

  const startJob = async () => {
    try {
      setIsProcessing(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/dispatcher/create-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl: pdfUrl, user: user.id }),
      })
      if (!response.ok) {
        throw new Error('Failed to start job')
      }
      // The job has been created, the status will be updated via the Supabase subscription
    } catch (error) {
      console.error('Error starting job:', error)
      alert('Failed to start job. Please try again.')
      setIsProcessing(false)
    }
  }

  const showInputForm = (jobStatus === 0 || jobStatus === null) && !isProcessing
  const showProgressBar = jobStatus > 0 || isProcessing

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          animate={{ rotate: jobStatus > 0 ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse animation-delay-500"></div>
          <div className="absolute inset-8 bg-primary/15 rounded-full animate-pulse animation-delay-1000"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {showProgressBar ? (
              <Video className="w-16 h-16 text-primary" />
            ) : (
              <BookOpen className="w-16 h-16 text-primary" />
            )}
          </div>
        </motion.div>

        {showInputForm && (
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
                <Button onClick={startJob}>Start Processing</Button>
              </div>
            )}
          </>
        )}

        {showProgressBar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-4">Generating Video Lecture</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {statusMessages[jobStatus]}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                ...
              </motion.span>
            </p>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: isProcessing && jobStatus === 0 ? '5%' : `${(jobStatus / 8) * 100}%` }} // Changed this line
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
