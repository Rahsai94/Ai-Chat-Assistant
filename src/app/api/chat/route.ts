/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validations/chat";
import { generateChatStream } from "@/services/ai";
import { createConversation, saveMessage, getConversation } from "@/services/conversation";
import { getSessionId } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { GoogleGenAI } from "@google/genai";

function generateTitle(messageContent: string): string {
  const title = messageContent.split("\n")[0].slice(0, 50).trim();
  return title || "New Conversation";
}

export async function POST(req: Request) {
  try {
    const sessionId = await getSessionId();

    // Rate limiting: 50 requests per hour per session
    const limit = 50;
    const windowMs = 60 * 60 * 1000;
    const rateLimitKey = `chat:${sessionId}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, limit, windowMs);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

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


    let relevantMessages = messages.slice(-50); // Hard cap at last 50

    // Handle DB persistence for user message
    let currentConversationId = conversationId;
    const latestUserMessage = messages[messages.length - 1];

    if (!currentConversationId) {
      // Create new conversation
      const newConversation = await createConversation(generateTitle(latestUserMessage.content), sessionId);
      currentConversationId = newConversation.id;
    } else {
      // Verify ownership of existing conversation
      const existingConversation = await getConversation(currentConversationId, sessionId);
      if (!existingConversation) {
        return NextResponse.json(
          { error: "Conversation not found or unauthorized" },
          { status: 403 }
        );
      }
    }

    // Save user message
    try {
      await saveMessage(currentConversationId, latestUserMessage.role, latestUserMessage.content);
    } catch (e) {
      console.error("Failed to save user message", e);
      return NextResponse.json({ error: "Failed to persist message" }, { status: 500 });
    }

    // Check for relevant documents
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        // Embed the user's latest query
        const embeddingResponse = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: latestUserMessage.content,
        });

        const queryEmbedding = embeddingResponse.embeddings?.[0]?.values;

        if (queryEmbedding && queryEmbedding.length > 0) {
          const formattedQueryEmbedding = `[${queryEmbedding.join(',')}]`;

          // Perform vector search
          // Note: <-> is the Euclidean distance operator in pgvector
          const relevantChunks = await prisma.$queryRaw`
            SELECT
              c.content,
              d.filename,
              c.id
            FROM "DocumentChunk" c
            JOIN "Document" d ON c."documentId" = d.id
            WHERE d."sessionId" = ${sessionId} AND d.status = 'COMPLETED'
            ORDER BY c.embedding <-> ${formattedQueryEmbedding}::vector
            LIMIT 5;
          ` as any[];

          if (relevantChunks && relevantChunks.length > 0) {
             const contextContent = relevantChunks.map(chunk =>
               `[Source: ${chunk.filename}]\n${chunk.content}`
             ).join("\n\n");

             const systemPrompt = `You have been provided with the following context documents to help answer the user's question.

Context Documents:
` + contextContent + `

Instructions:
1. Use the provided context documents to answer the user's question.
2. If the context documents do not contain enough information to answer the question, clearly state that you cannot answer the question based on the provided documents.
3. When using information from the context, provide inline citations using the source filename provided in the context (e.g., [Source: filename.pdf]). Do not fabricate citations or make up information.
`;
             relevantMessages = [
                 { id: "system-doc-context", role: "user", content: systemPrompt },
                 ...relevantMessages
             ];
          }
        }
      } catch (err) {
         console.error("Failed to retrieve document context:", err);
         // Gracefully continue without RAG context if search fails
      }
    }

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
