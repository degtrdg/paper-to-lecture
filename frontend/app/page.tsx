'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Video, Zap, Lock, ChevronRight, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { NextPage } from 'next'
import { useTheme } from "next-themes"
import { useRouter } from 'next/navigation'

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface Example {
  title: string;
  journal: string;
  videoLength: string;
  views: string;
  paperPreview: string;
}

const LandingPage: NextPage = () => {
  const [email, setEmail] = useState<string>('')
  const { theme } = useTheme()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      router.push(`/sign-up?username=${encodeURIComponent(email)}`)
    }
  }

  const features: Feature[] = [
    { icon: BookOpen, title: "Upload Paper", description: "Simply upload your research paper in PDF format." },
    { icon: Zap, title: "AI Processing", description: "Our AI analyzes and extracts key information from the paper." },
    { icon: Video, title: "Generate Video", description: "A clear, engaging video lecture is automatically created." }
  ]

  const examples: Example[] = [
    { title: "Quantum Computing Breakthroughs", journal: "Nature Physics", videoLength: "15:23", views: "12.5K", paperPreview: "/placeholder.svg?height=100&width=77" },
    { title: "Advancements in CRISPR Technology", journal: "Cell", videoLength: "18:47", views: "9.8K", paperPreview: "/placeholder.svg?height=100&width=77" },
    { title: "Dark Matter Detection Methods", journal: "Astrophysical Journal", videoLength: "20:11", views: "7.2K", paperPreview: "/placeholder.svg?height=100&width=77" },
    { title: "Neural Networks in Climate Modeling", journal: "Science", videoLength: "16:39", views: "11.3K", paperPreview: "/placeholder.svg?height=100&width=77" }
  ]

  return (
    <div className={`min-h-screen w-full ${
      theme === 'dark' 
        ? 'bg-background text-foreground' 
        : 'bg-white text-black bg-graph-paper bg-graph-paper'
    }`}>
      <header className={`w-full px-4 py-6 ${theme === 'dark' ? 'bg-background' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">LectureGen</span>
          </div>
          <nav className="space-x-4 flex items-center">
            <Button variant="outline" asChild>
              <Link href="/sign-in">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className={`w-full px-4 py-24 ${
          theme === 'dark' ? '' : 'bg-white/80'
        }`}>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">Transform Your Research with AI</h1>
            <p className="text-xl mb-12">Unlock the power of your academic papers with our AI-driven analysis tool</p>
            <div className="flex justify-center mb-12">
              <div className="relative w-64 h-64">
                <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-primary/20' : 'bg-primary/10'} rounded-full animate-pulse`}></div>
                <div className={`absolute inset-4 ${theme === 'dark' ? 'bg-primary/40' : 'bg-primary/20'} rounded-full animate-pulse animation-delay-500`}></div>
                <div className={`absolute inset-8 ${theme === 'dark' ? 'bg-primary/60' : 'bg-primary/30'} rounded-full animate-pulse animation-delay-1000`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute top-1/2 left-full transform -translate-y-1/2 w-16 h-1 bg-primary"></div>
                <div className="absolute top-1/2 left-[calc(100%+4rem)] transform -translate-y-1/2">
                  <Video className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className={`flex-grow ${theme === 'dark' ? 'bg-input' : 'bg-gray-100'}`}
                />
                <Button type="submit">Get Started</Button>
              </form>
            </div>
          </div>
        </section>

        <section className={`w-full py-24 ${
          theme === 'dark' ? 'bg-muted' : 'bg-gray-100/80'
        }`}>
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className={`${theme === 'dark' ? 'bg-card' : 'bg-white'} text-card-foreground`}>
                  <CardContent className="p-6 text-center">
                    <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-24">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Example Transformations</h2>
            <div className="grid grid-cols-1 gap-12">
              {examples.map((example, index) => (
                <div key={index} className="group relative bg-muted rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start mb-4">
                        <Link href="#" className="flex-shrink-0 mr-4 transition-transform duration-300 transform hover:scale-105">
                          <Image
                            src={example.paperPreview}
                            alt={`Preview of ${example.title}`}
                            width={77}
                            height={100}
                            className="rounded shadow-md"
                          />
                        </Link>
                        <div>
                          <h3 className="text-2xl font-semibold mb-2">{example.title}</h3>
                          <p className="text-muted-foreground">Original paper from {example.journal}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center"><Video className="w-4 h-4 mr-1" /> {example.videoLength}</span>
                        <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" /> {example.views} views</span>
                        <Link href="#" className="flex items-center text-primary hover:underline">
                          <FileText className="w-4 h-4 mr-1" /> View Full Paper
                        </Link>
                      </div>
                    </div>
                    <div className="md:w-1/3 bg-primary/5 flex items-center justify-center p-6">
                      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-16 h-16 text-primary/50" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-background/80 p-2 rounded-full">
                          <Lock className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="secondary" size="sm" className="flex items-center">
                      Watch Preview <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={`w-full py-24 ${
          theme === 'dark' ? 'bg-muted' : 'bg-gray-100/80'
        }`}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Research?</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Join LectureGen today and start creating engaging video content from papers.
            </p>
            <Button size="lg">Get Started Now</Button>
          </div>
        </section>
      </main>

      <footer className={`w-full py-12 ${
        theme === 'dark' 
          ? 'bg-background text-muted-foreground' 
          : 'bg-white text-gray-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 LectureGen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
