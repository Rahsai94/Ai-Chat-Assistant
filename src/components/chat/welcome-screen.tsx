import { Bot, Lightbulb, Code2, BookOpen, Presentation } from "lucide-react"
import { Card } from "@/components/ui/card"

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void
}

const suggestedPrompts = [
  {
    title: "Explain a concept",
    description: "Explain a programming concept simply.",
    icon: Lightbulb,
    prompt: "Can you explain the concept of React Server Components and how they differ from Client Components?",
  },
  {
    title: "Debug code",
    description: "Help me debug a code snippet.",
    icon: Code2,
    prompt: "I have a bug in my PostgreSQL Prisma query. Can you help me find it?",
  },
  {
    title: "Summarize topic",
    description: "Summarize a complex technical topic.",
    icon: BookOpen,
    prompt: "Summarize the key differences between OAuth 2.0 and SAML authentication.",
  },
  {
    title: "Plan project",
    description: "Help me plan an AI project.",
    icon: Presentation,
    prompt: "Help me plan the architecture for an AI-powered SaaS application using Next.js and Vercel.",
  },
]

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto w-full h-full">
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="p-4 bg-primary/10 rounded-full">
          <Bot className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          How can I help you today?
        </h2>
        <p className="text-muted-foreground max-w-md">
          I am your AI Chat Assistant, powered by Gemini. I can help you write code, debug issues, and learn new technical concepts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {suggestedPrompts.map((item, index) => (
          <Card
            key={index}
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col gap-2"
            onClick={() => onPromptSelect(item.prompt)}
          >
            <div className="flex items-center gap-2 font-medium">
              <item.icon className="h-5 w-5 text-primary" />
              <span>{item.title}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {item.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
