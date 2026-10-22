import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col relative w-full h-full">
          {children}
        </main>
      </div>
    </div>
  )
}
