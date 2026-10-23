import { prisma } from "@/lib/db/prisma";
import "server-only";

export async function createConversation(title: string, sessionId: string) {
  return await prisma.conversation.create({
    data: { title, sessionId },
  });
}

export async function getConversations(sessionId: string) {
  return await prisma.conversation.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getConversation(id: string, sessionId: string) {
  return await prisma.conversation.findFirst({
    where: { id, sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function saveMessage(conversationId: string, role: string, content: string, status: string = "completed") {
  return await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      status,
    },
  });
}

export async function deleteConversation(id: string, sessionId: string) {
  const conversation = await getConversation(id, sessionId);
  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  // Cascades because of onDelete: Cascade in schema
  return await prisma.conversation.delete({
    where: { id },
  });
}

export async function updateConversationTitle(id: string, sessionId: string, title: string) {
  const conversation = await getConversation(id, sessionId);
  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  return await prisma.conversation.update({
    where: { id },
    data: { title },
  });
}
