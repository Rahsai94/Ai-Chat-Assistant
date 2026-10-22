"use client"

import { PlusCircle, MessageSquare, PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"
import { cn } from "@/lib/utils"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

// Fixture Data
const recentChats = [
  { id: "1", title: "React Hooks Explanation" },
  { id: "2", title: "Debug PostgreSQL Query" },
  { id: "3", title: "AI Portfolio Brainstorming" },
]

function SidebarContent() {
  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b">
        <Button className="w-full justify-start gap-2" variant="default">
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
            Recent Chats
          </h4>
          {recentChats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className="w-full justify-start font-normal"
            >
              <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{chat.title}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger render={
          <Button variant="ghost" size="icon" className="md:hidden fixed bottom-4 left-4 z-50 rounded-full shadow-md bg-background border">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        } />
        <SheetContent side="left" className="p-0 w-72">
          <VisuallyHidden.Root>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden.Root>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col border-r transition-all duration-300 relative",
          isDesktopCollapsed ? "w-0 overflow-hidden" : "w-64"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop Toggle Button */}
      <div className="hidden md:block absolute left-4 top-20 z-10">
         <Button
          variant="outline"
          size="icon"
          className={cn("rounded-full shadow-sm transition-transform", isDesktopCollapsed ? "" : "translate-x-60 absolute -left-4")}
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        >
          {isDesktopCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>
    </>
  )
}
