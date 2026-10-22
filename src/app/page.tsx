import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">AI Chat Assistant</h1>
        <p className="text-xl text-muted-foreground">
          Welcome to your new full-stack AI conversational experience, powered by Gemini and Next.js.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/chat"
            className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Chatting
          </Link>
        </div>
      </div>
    </main>
  );
}
