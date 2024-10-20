'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Home, Video, Settings, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { usePathname } from 'next/navigation'
import Link from "next/link"
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export default function Sidebar({ initialPathname }: { initialPathname: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const [showSidebar, setShowSidebar] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const currentPath = pathname || initialPathname
    const isAuthPage = currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up')
    const isLandingPage = currentPath === '/'
    setShowSidebar(!isAuthPage && !isLandingPage)
  }, [pathname, initialPathname])

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchUser()
  }, [])

  if (!showSidebar) return null

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/home' },
    { icon: Video, label: 'Videos', href: '/videos' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <motion.div
      className="bg-muted flex flex-col h-screen"
      initial={{ width: sidebarOpen ? 250 : 60 }}
      animate={{ width: sidebarOpen ? 250 : 60 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">LectureGen</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      <div className="h-px bg-muted-foreground/20 my-2" />

      <nav className="flex-1 p-4">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center space-x-2 p-2 rounded-lg mb-1 ${
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-primary/5'
            }`}
          >
            <item.icon size={18} />
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="h-px bg-muted-foreground/20 my-2" />

      <div className="p-4 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground">
          {user ? user.email?.charAt(0).toUpperCase() : 'U'}
        </div>
        {sidebarOpen && (
          <div className="ml-2">
            <p className="text-sm font-medium">{user ? user.email : 'Loading...'}</p>
            <p className="text-xs text-muted-foreground">{user ? user.id : ''}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
