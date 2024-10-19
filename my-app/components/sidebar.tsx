'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Home, Video, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname } from 'next/navigation';
import Link from "next/link"

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname();
  return (
    pathname === '/home' || pathname === '/videos' ? (
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
          <Link href="/home" className="flex items-center space-x-2 text-primary">
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
    ) : null
  )
}
