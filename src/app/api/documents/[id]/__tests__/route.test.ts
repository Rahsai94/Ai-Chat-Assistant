/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "../route";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionId: vi.fn().mockResolvedValue("test-session-id"),
}));

describe("DELETE /api/documents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete document if it belongs to session", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue({ id: "doc-1", sessionId: "test-session-id" } as any);
    vi.mocked(prisma.document.delete).mockResolvedValue({} as any);

    const request = new Request("http://localhost/api/documents/doc-1", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "doc-1" }) });

    expect(response.status).toBe(200);
    expect(prisma.document.findFirst).toHaveBeenCalledWith({
      where: { id: "doc-1", sessionId: "test-session-id" },
    });
    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: "doc-1" },
    });
  });

  it("should return 404 if document does not exist or unauthorized", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

    const request = new Request("http://localhost/api/documents/doc-1", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "doc-1" }) });

    expect(response.status).toBe(404);
    expect(prisma.document.delete).not.toHaveBeenCalled();
  });
});
