import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only before importing the route
vi.mock("server-only", () => ({}));
vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn((promise) => promise),
}));

import { POST, GET } from "../route";
import { prisma } from "@/lib/db/prisma";
import * as sessionModule from "@/lib/auth/session";
import * as rateLimitModule from "@/lib/rate-limit";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionId: vi.fn().mockResolvedValue("test-session-id"),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 19 }),
}));

// Mock pdf-parse
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "Mocked PDF content" }),
}));

// Mock GoogleGenAI correctly matching how we use it
const mockEmbedContent = vi.fn().mockResolvedValue({
  embeddings: [{ values: new Array(768).fill(0.1) }],
});

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        embedContent: mockEmbedContent,
      };
    },
  };
});

describe("Document API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("POST /api/documents", () => {
    it("should accept valid text file and start processing", async () => {
      const formData = new FormData();
      const fileContent = "This is a test document.";
      const file = new File([fileContent], "test.txt", { type: "text/plain" });
      formData.append("file", file);

      const request = new Request("http://localhost/api/documents", {
        method: "POST",
        body: formData,
      });

      const mockCreatedDoc = { id: "doc-1", filename: "test.txt", status: "PENDING", sessionId: "test-session-id" };
      vi.mocked(prisma.document.create).mockResolvedValue(mockCreatedDoc as any);
      vi.mocked(prisma.document.update).mockResolvedValue({ ...mockCreatedDoc, status: "COMPLETED" } as any);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.document.id).toBe("doc-1");

      // Wait a tick for async background processing to start/finish in test env
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "doc-1" },
        data: { status: "COMPLETED" },
      }));
    });

    it("should reject files over 5MB", async () => {
      const request = new Request("http://localhost/api/documents", { method: "POST" });
      const spy = vi.spyOn(request, 'formData').mockResolvedValue({
        get: (key: string) => {
          if (key === 'file') return { name: 'large.txt', size: 6 * 1024 * 1024, type: 'text/plain' };
          return null;
        }
      } as any);

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/exceeds 5MB/);
    });

    it("should reject unsupported file types", async () => {
      const formData = new FormData();
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      formData.append("file", file);

      const request = new Request("http://localhost/api/documents", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/Unsupported file type/);
    });
  });

  describe("GET /api/documents", () => {
    it("should fetch documents for the session", async () => {
      const mockDocs = [{ id: "1", filename: "test.pdf" }];
      vi.mocked(prisma.document.findMany).mockResolvedValue(mockDocs as any);

      const request = new Request("http://localhost/api/documents");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.documents).toEqual(mockDocs);
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { sessionId: "test-session-id" },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
