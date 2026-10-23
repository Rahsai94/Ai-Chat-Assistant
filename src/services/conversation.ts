import { prisma } from "@/lib/db/prisma";
import "server-only";

export async function createConversation(title: string) {
  return await prisma.conversation.create({
    data: { title },
  });
}

export async function getConversations() {
  return await prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getConversation(id: string) {
  return await prisma.conversation.findUnique({
    where: { id },
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

export async function deleteConversation(id: string) {
  // Cascades because of onDelete: Cascade in schema
  return await prisma.conversation.delete({
    where: { id },
  });
}

export async function updateConversationTitle(id: string, title: string) {
  return await prisma.conversation.update({
    where: { id },
    data: { title },
  });
}
