'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const [aiPrompt, setAiPrompt] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the settings to your backend
    // For now, we'll just log to the console
    console.log('Settings saved:', { aiPrompt, voiceEnabled, apiKey })
    alert('Settings saved successfully!')
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <form onSubmit={handleSaveSettings}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Agent Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aiPrompt">AI Agent Prompt</Label>
                  <Textarea
                    id="aiPrompt"
                    placeholder="Enter the prompt for your AI agent..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="mt-1"
                    rows={5}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="voiceEnabled"
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="voiceEnabled">Enable Voice Interaction</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit">Save Settings</Button>
        </form>
      </div>
    </div>
  )
}
