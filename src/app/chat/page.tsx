"use client"

import { useState, useRef, useEffect } from "react"
import { WelcomeScreen } from "@/components/chat/welcome-screen"
import { MessageBubble, type Message } from "@/components/chat/message-bubble"
import { MessageComposer } from "@/components/chat/message-composer"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt)
    // Optionally auto-submit:
    // simulateSubmit(prompt)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    simulateSubmit(input)
  }

  // Fixture submission handler for UI development
  const simulateSubmit = (submittedText: string) => {
    if (!submittedText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: submittedText.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a simulated response to: "${submittedText.trim()}". The real AI integration will be implemented in a future phase.`,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full relative">
      <ScrollArea className="flex-1 pb-32">
        {messages.length === 0 ? (
          <WelcomeScreen onPromptSelect={handlePromptSelect} />
        ) : (
          <div className="flex flex-col pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex w-full gap-4 p-4 md:p-6 bg-muted/30">
                <div className="max-w-3xl mx-auto flex w-full gap-4 items-center text-muted-foreground text-sm">
                  <div className="h-4 w-4 animate-pulse bg-primary/40 rounded-full" />
                  Assistant is thinking...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <MessageComposer
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
