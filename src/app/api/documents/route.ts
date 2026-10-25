import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit } from "@/lib/rate-limit";
import { waitUntil } from "@vercel/functions";

// Ensure AI services are only run on the server
import "server-only";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "text/plain"];

// Chunking configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const sessionId = await getSessionId();

    // Rate limiting: 20 document uploads per hour per session
    const limit = 20;
    const windowMs = 60 * 60 * 1000;
    const rateLimitKey = `docs:${sessionId}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, limit, windowMs);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF or TXT file." }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        sessionId,
        filename: file.name,
        status: "PENDING",
      },
    });


    // Start background processing
    waitUntil(
      processDocument(file, document.id).catch(async (error) => {
        console.error(`Failed to process document ${document.id}:`, error);
        await prisma.document.update({
          where: { id: document.id },
          data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" },
        });
      })
    );

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error("[DOCUMENT_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while uploading the document." },
      { status: 500 }
    );
  }
}

async function processDocument(file: File, documentId: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let text = "";

  if (file.type === "application/pdf") {
    try {
        const pdfParseMod = (await import("pdf-parse")) as any;
        const pdfParse = pdfParseMod.default || pdfParseMod;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
    } catch (e) {
         throw new Error("Failed to parse PDF file. Ensure it is a valid PDF.");
    }
  } else if (file.type === "text/plain") {
    text = buffer.toString("utf-8");
  }

  if (!text || text.trim() === "") {
    throw new Error("Document is empty or text could not be extracted.");
  }

  const chunks = chunkText(text.trim());

  if (chunks.length === 0) {
     throw new Error("No text chunks could be generated.");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const embeddingModel = "text-embedding-004";

  for (let i = 0; i < chunks.length; i++) {
    const chunkTextContent = chunks[i];

    // Use try catch here so we can fail the whole document gracefully if we run into API errors
    let embeddingResponse;
    try {
        embeddingResponse = await ai.models.embedContent({
            model: embeddingModel,
            contents: chunkTextContent,
        });
    } catch (e: any) {
        throw new Error(`Failed to generate embedding for chunk ${i}: ${e.message}`);
    }

    const embedding = embeddingResponse.embeddings?.[0]?.values;

    if (!embedding || embedding.length === 0) {
      throw new Error(`Generated embedding is empty for chunk ${i}`);
    }

    // Prisma doesn't natively support creating records with Unsupported types via the fluent API.
    // We must use $executeRaw to insert the chunk with the vector embedding.
    const chunkId = require('crypto').randomBytes(16).toString('hex');
    const formattedEmbedding = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", content, "pageNumber", embedding)
      VALUES (${chunkId}, ${documentId}, ${chunkTextContent}, ${null}, ${formattedEmbedding}::vector)
    `;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "COMPLETED" },
  });
}

export async function GET(req: Request) {
  try {
    const sessionId = await getSessionId();

    const documents = await prisma.document.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("[DOCUMENT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch documents." },
      { status: 500 }
    );
  }
}
