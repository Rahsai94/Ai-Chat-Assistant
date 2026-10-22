"use client"

import { useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageComposerProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function MessageComposer({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        // Create a synthetic event to pass to handleSubmit
        const formEvent = new Event('submit', { cancelable: true, bubbles: true }) as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(formEvent)
      }
    }
  }

  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/80 to-transparent pt-6 pb-4 px-4">
      <div className="max-w-3xl mx-auto relative flex items-end w-full border bg-background rounded-xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !isLoading) {
              handleSubmit(e)
            }
          }}
          className="flex w-full"
        >
          <Textarea
            ref={textareaRef}
            tabIndex={0}
            placeholder="Type your message here..."
            className="min-h-[52px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 rounded-none py-4 px-4 pr-14"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            aria-label="Message input"
          />
          <div className="absolute right-2 bottom-2">
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 rounded-lg"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          AI Assistant can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  )
}
