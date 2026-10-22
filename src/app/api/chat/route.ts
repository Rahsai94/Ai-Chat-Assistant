import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validations/chat";
import { generateChatResponse } from "@/services/ai";

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

    const { messages } = parseResult.data;

    // Optional: Filter system messages out if they shouldn't be processed here,
    // or limit the number of forwarded history items to manage tokens context limits.
    const relevantMessages = messages.slice(-50); // Hard cap at last 50 for context limits if not already handled by schema max length

    // Fetch response from AI provider
    const aiResponse = await generateChatResponse(relevantMessages);

    if (!aiResponse.success) {
      return NextResponse.json(
        { error: aiResponse.error },
        { status: aiResponse.status || 500 }
      );
    }

    // Return successful response mapped back to predictable frontend shape
    return NextResponse.json({
      message: {
        role: "assistant",
        content: aiResponse.text,
      }
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
