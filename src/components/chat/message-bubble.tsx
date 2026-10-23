/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { Bot, User, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "")
  const isCodeBlock = !inline && match

  const codeText = String(children).replace(/\n$/, "")
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (isCodeBlock) {
    return (
      <div className="relative group rounded-md overflow-hidden my-4 border">
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted text-muted-foreground text-xs">
          <span>{match[1]}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            aria-label="Copy code"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          {...props}
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          className="!mt-0 !mb-0 !rounded-none text-sm"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            padding: "1rem",
          }}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono", className)} {...props}>
      {children}
    </code>
  )
}

const markdownComponents: Components = {
  code: CodeBlock,
}

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
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="font-semibold text-sm">
            {isUser ? "You" : "AI Assistant"}
          </div>
          <div className="text-sm max-w-none break-words">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown
                className="prose prose-sm dark:prose-invert max-w-none"
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
