import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-8 text-center sm:p-20">
      <div className="max-w-2xl space-y-8 flex flex-col items-center">
        <div className="p-6 bg-primary/10 rounded-full shadow-lg border border-primary/20">
          <Hexagon className="h-16 w-16 text-primary fill-primary/20" />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent pb-2">
            Welcome to Vortex
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Your smart assistant, here to make things easier for you. Whether you need quick answers, help with tasks, or just a friendly chat, I&apos;ve got you covered!
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-8">
          <Link
            href="/chat"
            className="px-8 py-3 font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
