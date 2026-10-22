import { z } from "zod";

const messageRoleSchema = z.enum(["user", "assistant"]);

export const messageSchema = z.object({
  id: z.string().optional(),
  role: messageRoleSchema,
  content: z.string().min(1, "Message content cannot be empty").max(10000, "Message content exceeds length limit"),
});

export const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  messages: z.array(messageSchema).max(100, "Too many messages in history"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type Message = z.infer<typeof messageSchema>;
