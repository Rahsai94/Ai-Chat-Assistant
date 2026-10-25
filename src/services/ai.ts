/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";
import { Message } from "@/lib/validations/chat";

// Ensure AI services are only run on the server
import "server-only";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is missing.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function generateChatResponse(messages: Message[]) {
  // Validate model config is available
  if (!defaultModel) {
    throw new Error("AI Model not configured.");
  }

  // Format messages for Gemini API
  // Map 'assistant' to 'model' for Gemini
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: defaultModel,
      contents,
    });

    return {
      success: true,
      text: response.text || "",
    };
  } catch (error: any) {
    console.error("AI Generation Error:", error.message || error);

    // Check for rate limits or other specific errors if needed
    if (error.status === 429) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        status: 429,
      };
    }

    return {
      success: false,
      error: "Failed to generate AI response due to a provider error.",
      status: 500,
    };
  }
}

export async function generateChatStream(messages: Message[], systemInstruction?: string) {
  // Validate model config is available
  if (!defaultModel) {
    throw new Error("AI Model not configured.");
  }

  // Format messages for Gemini API
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  try {
    const stream = await ai.models.generateContentStream({
      model: defaultModel,
      contents,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return { success: true, stream };
  } catch (error: any) {
    console.error("AI Generation Stream Error:", error.message || error);
    if (error.status === 429) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        status: 429,
      };
    }
    return {
      success: false,
      error: "Failed to generate AI stream due to a provider error.",
      status: 500,
    };
  }
}
