export { cn } from "cn"

export function generateTitle(messageContent: string): string {
  const title = messageContent.split("\n")[0].slice(0, 50).trim();
  return title || "New Conversation";
}
