import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-4 md:p-6",
        isUser ? "bg-background" : "bg-muted/30"
      )}
    >
      <div className="max-w-3xl mx-auto flex w-full gap-4">
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
            {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="font-semibold text-sm">
            {isUser ? "You" : "AI Assistant"}
          </div>
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}
