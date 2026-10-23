/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  // Listen for clear chat event from sidebar
  useEffect(() => {
    const handleClearChat = () => {
      setMessages([])
      setInput("")
      setIsLoading(false)
      setConversationId(undefined)
    }
    window.addEventListener('clear-chat', handleClearChat)
    return () => window.removeEventListener('clear-chat', handleClearChat)
  }, [])

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
    sendMessage(input)
  }

  const sendMessage = async (submittedText: string) => {
    if (!submittedText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: submittedText.trim(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
           const errorData = await response.json();
           throw new Error(errorData.error || "Failed to fetch AI response");
        } else {
           throw new Error("Failed to fetch AI response");
        }
      }

      if (!response.body) {
        throw new Error("ReadableStream not yet supported in this browser.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      const currentAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, currentAssistantMessage])

      let buffer = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value, { stream: true })

        if (chunkValue) {
          buffer += chunkValue
          let lineEndIndex
          while ((lineEndIndex = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, lineEndIndex).trim()
            buffer = buffer.slice(lineEndIndex + 2)

            if (block.startsWith("data: ")) {
              const dataStr = block.slice("data: ".length)

              if (dataStr === "[DONE]") {
                continue
              }

              try {
                const data = JSON.parse(dataStr)

                if (data.conversationId && !conversationId) {
                  setConversationId(data.conversationId)
                }
                if (data.text) {
                  currentAssistantMessage.content += data.text
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentAssistantMessage.id ? { ...msg, content: currentAssistantMessage.content } : msg
                    )
                  )
                }
                if (data.error) {
                  throw new Error(data.error)
                }
              } catch (e: any) {
                if (e.message === dataStr) {
                  throw e; // Rethrow explicit stream errors
                }
                console.error("Failed to parse SSE data chunk", e, "Chunk:", dataStr)
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Stream aborted")
      } else {
        console.error("Failed to send message:", error)

        // Revert optimistic UI updates by restoring the user's input text and removing the unsaved messages
        setInput(submittedText);
        setMessages(messages); // restore messages back to what they were before the request
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
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
        stop={stop}
      />
    </div>
  )
}
