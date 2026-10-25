import { Lightbulb, Code2, BookOpen, Presentation, Hexagon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void
}

const suggestedPrompts = [
  {
    title: "Write a business report",
    description: "Write a business report on market trends.",
    icon: BookOpen,
    prompt: "Write a comprehensive business report on current software market trends.",
  },
  {
    title: "Analyze Sales Data",
    description: "Help me analyze recent sales data.",
    icon: Presentation,
    prompt: "I have some sales data. What are the key metrics I should look at to analyze performance?",
  },
  {
    title: "Generate a blog",
    description: "Generate a blog post about AI.",
    icon: Lightbulb,
    prompt: "Generate an engaging blog post about the impact of generative AI on creative industries.",
  },
  {
    title: "Debug code",
    description: "Help me debug a code snippet.",
    icon: Code2,
    prompt: "I have a bug in my PostgreSQL Prisma query. Can you help me find it?",
  },
]

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full h-full min-h-[60vh]">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <div className="p-4 bg-primary/10 rounded-full border border-primary/20 shadow-sm mb-2">
          <Hexagon className="h-10 w-10 text-primary fill-primary/10" />
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          How can <span className="text-primary">Vortex</span> help you today?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl">
          I&apos;m your smart assistant, here to make things easier for you. Select a prompt below or just type your request to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {suggestedPrompts.map((item, index) => (
          <Card
            key={index}
            className="p-5 cursor-pointer hover:bg-muted/80 hover:border-primary/50 transition-all flex flex-col gap-3 group bg-card/50 backdrop-blur border-border/50"
            onClick={() => onPromptSelect(item.prompt)}
          >
            <div className="flex items-center gap-3 font-semibold text-foreground group-hover:text-primary transition-colors">
              <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span>{item.title}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-[44px]">
              {item.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
