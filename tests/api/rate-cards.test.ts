import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/rate-cards/route";
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/rate-cards/[id]/route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    savedRateCard: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper to create NextRequest with JSON body
function createRequest(body?: unknown, method = "GET"): NextRequest {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return new NextRequest("http://localhost:3000/api/rate-cards", options);
}

const mockSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
  },
};

const mockRateCard = {
  id: "rate-card-1",
  creatorId: "user-1",
  name: "Test Rate Card",
  platform: "instagram",
  contentFormat: "reel",
  baseRate: 400,
  finalRate: 520,
  adjustments: [
    { name: "Platform", description: "Instagram baseline", type: "multiply", value: 1.0 },
  ],
  dealQuality: null,
  briefId: null,
  brandName: "Test Brand",
  campaignName: "Summer Campaign",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
  lastAccessedAt: new Date("2024-01-20"),
};

describe("/api/rate-cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // GET /api/rate-cards
  // ==========================================================================

  describe("GET /api/rate-cards", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("returns empty array when no rate cards exist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findMany).mockResolvedValueOnce([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("returns rate cards for authenticated user", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findMany).mockResolvedValueOnce([mockRateCard]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe("rate-card-1");
      expect(db.savedRateCard.findMany).toHaveBeenCalledWith({
        where: { creatorId: "user-1" },
        orderBy: { lastAccessedAt: "desc" },
      });
    });
  });

  // ==========================================================================
  // POST /api/rate-cards
  // ==========================================================================

  describe("POST /api/rate-cards", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const request = createRequest(
        {
          platform: "instagram",
          contentFormat: "reel",
          baseRate: 400,
          finalRate: 500,
          adjustments: [],
        },
        "POST"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 400 when platform is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);

      const request = createRequest(
        {
          contentFormat: "reel",
          baseRate: 400,
          finalRate: 500,
          adjustments: [],
        },
        "POST"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Platform is required");
    });

    it("returns 400 when contentFormat is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);

      const request = createRequest(
        {
          platform: "instagram",
          baseRate: 400,
          finalRate: 500,
          adjustments: [],
        },
        "POST"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Content format is required");
    });

    it("returns 400 when baseRate is invalid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);

      const request = createRequest(
        {
          platform: "instagram",
          contentFormat: "reel",
          baseRate: -100,
          finalRate: 500,
          adjustments: [],
        },
        "POST"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("base rate");
    });

    it("returns 400 when adjustments is not an array", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);

      const request = createRequest(
        {
          platform: "instagram",
          contentFormat: "reel",
          baseRate: 400,
          finalRate: 500,
          adjustments: "not an array",
        },
        "POST"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("array");
    });

    it("creates rate card successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.create).mockResolvedValueOnce(mockRateCard);

      const request = createRequest(
        {
          name: "Test Rate Card",
          platform: "instagram",
          contentFormat: "reel",
          baseRate: 400,
          finalRate: 520,
          adjustments: [
            { name: "Platform", description: "Instagram baseline", type: "multiply", value: 1.0 },
          ],
          brandName: "Test Brand",
        },
        "POST"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("rate-card-1");
      expect(db.savedRateCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId: "user-1",
          platform: "instagram",
          contentFormat: "reel",
          baseRate: 400,
          finalRate: 520,
        }),
      });
    });

    it("uses default name when not provided", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.create).mockResolvedValueOnce({
        ...mockRateCard,
        name: "Untitled Rate Card",
      });

      const request = createRequest(
        {
          platform: "instagram",
          contentFormat: "reel",
          baseRate: 400,
          finalRate: 500,
          adjustments: [],
        },
        "POST"
      );

      await POST(request);

      expect(db.savedRateCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Untitled Rate Card",
        }),
      });
    });
  });
});

describe("/api/rate-cards/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // GET /api/rate-cards/[id]
  // ==========================================================================

  describe("GET /api/rate-cards/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const request = createRequest();
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 404 when rate card not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce(null);

      const request = createRequest();
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: "nonexistent" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });

    it("returns 403 when accessing another user's rate card", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce({
        ...mockRateCard,
        creatorId: "other-user",
      });

      const request = createRequest();
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("permission");
    });

    it("returns rate card and updates lastAccessedAt", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce(mockRateCard);
      vi.mocked(db.savedRateCard.update).mockResolvedValueOnce({
        ...mockRateCard,
        lastAccessedAt: new Date(),
      });

      const request = createRequest();
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("rate-card-1");
      expect(db.savedRateCard.update).toHaveBeenCalledWith({
        where: { id: "rate-card-1" },
        data: { lastAccessedAt: expect.any(Date) },
      });
    });
  });

  // ==========================================================================
  // PUT /api/rate-cards/[id]
  // ==========================================================================

  describe("PUT /api/rate-cards/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const request = createRequest({ name: "Updated Name" }, "PUT");
      const response = await PUT(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 404 when rate card not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce(null);

      const request = createRequest({ name: "Updated Name" }, "PUT");
      const response = await PUT(request, { params: Promise.resolve({ id: "nonexistent" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it("returns 403 when updating another user's rate card", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce({
        ...mockRateCard,
        creatorId: "other-user",
      });

      const request = createRequest({ name: "Updated Name" }, "PUT");
      const response = await PUT(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it("updates rate card successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce(mockRateCard);
      vi.mocked(db.savedRateCard.update).mockResolvedValueOnce({
        ...mockRateCard,
        name: "Updated Name",
        updatedAt: new Date(),
      });

      const request = createRequest({ name: "Updated Name" }, "PUT");
      const response = await PUT(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Updated Name");
      expect(db.savedRateCard.update).toHaveBeenCalledWith({
        where: { id: "rate-card-1" },
        data: expect.objectContaining({
          name: "Updated Name",
          lastAccessedAt: expect.any(Date),
        }),
      });
    });
  });

  // ==========================================================================
  // DELETE /api/rate-cards/[id]
  // ==========================================================================

  describe("DELETE /api/rate-cards/[id]", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const request = createRequest(undefined, "DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("returns 404 when rate card not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce(null);

      const request = createRequest(undefined, "DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it("returns 403 when deleting another user's rate card", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce({
        ...mockRateCard,
        creatorId: "other-user",
      });

      const request = createRequest(undefined, "DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it("deletes rate card successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.savedRateCard.findUnique).mockResolvedValueOnce(mockRateCard);
      vi.mocked(db.savedRateCard.delete).mockResolvedValueOnce(mockRateCard);

      const request = createRequest(undefined, "DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "rate-card-1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
      expect(db.savedRateCard.delete).toHaveBeenCalledWith({
        where: { id: "rate-card-1" },
      });
    });
  });
});
