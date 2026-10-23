import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validations/chat";
import { generateChatStream } from "@/services/ai";
import { createConversation, saveMessage } from "@/services/conversation";

function generateTitle(messageContent: string): string {
  const title = messageContent.split("\n")[0].slice(0, 50).trim();
  return title || "New Conversation";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate incoming request
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { messages, conversationId } = parseResult.data;

    const relevantMessages = messages.slice(-50); // Hard cap at last 50

    // Handle DB persistence for user message
    let currentConversationId = conversationId;
    const latestUserMessage = messages[messages.length - 1];

    if (!currentConversationId) {
      // Create new conversation
      const newConversation = await createConversation(generateTitle(latestUserMessage.content));
      currentConversationId = newConversation.id;
    }

    // Save user message
    await saveMessage(currentConversationId, latestUserMessage.role, latestUserMessage.content);

    // Fetch response stream from AI provider
    const aiResponse = await generateChatStream(relevantMessages);

    if (!aiResponse.success || !aiResponse.stream) {
      return NextResponse.json(
        { error: aiResponse.error || "Failed to generate AI stream" },
        { status: aiResponse.status || 500 }
      );
    }

    const stream = aiResponse.stream;

    // Build a custom ReadableStream to stream the SSE chunks and track the full response for saving
    let fullContent = "";

    const customStream = new ReadableStream({
      async start(controller) {
        // Send initial metadata chunk
        controller.enqueue(
          new TextEncoder().encode(`data: {"conversationId": "${currentConversationId}"}\n\n`)
        );

        try {
          for await (const chunk of stream) {
            if (req.signal.aborted) {
              await saveMessage(currentConversationId as string, "assistant", fullContent, "aborted");
              return;
            }

            const textChunk = chunk.text;
            if (textChunk) {
              fullContent += textChunk;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text: textChunk })}\n\n`)
              );
            }
          }

          if (!req.signal.aborted) {
             await saveMessage(currentConversationId as string, "assistant", fullContent, "completed");
          }
        } catch (error) {
          console.error("Error during streaming", error);
          await saveMessage(currentConversationId as string, "assistant", fullContent, "failed");
          controller.enqueue(
            new TextEncoder().encode(`data: {"error": "Stream interrupted"}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[CHAT_API_ERROR]", error);

    // Do not leak stack traces or raw provider errors to client
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
