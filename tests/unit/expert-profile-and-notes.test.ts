import { beforeEach, describe, expect, it, vi } from "vitest";
// vi.mock calls below are hoisted above these imports, so the routes see the mocks
import { PATCH as setNotesPolicy } from "@/app/api/admin/experts/[id]/notes-policy/route";
import { PATCH as saveExpertProfile } from "@/app/api/expert/profile/route";
import { validateExpert, emptyExpertDraft, type ExpertDraft } from "@/lib/expert-admin";

/**
 * Who owns which part of a practitioner.
 *
 *   - An admin creates the listing with the facts we vouch for and a login;
 *     the practitioner completes the rest from the portal, and that is
 *     written to the listing clients actually see.
 *   - Only an admin clears a practitioner to keep session notes, and every
 *     change is audited.
 */

const db = vi.hoisted(() => ({
  expert: { findUnique: vi.fn(), update: vi.fn() },
  expertProfile: { findUnique: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));
const session = vi.hoisted(() => ({ current: null as null | { sub: string; role: string; email: string; name: string } }));
const record = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ getSession: async () => session.current }));
vi.mock("@/lib/audit", () => ({ record }));

const request = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "PATCH",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const admin = { sub: "a1", role: "ADMIN", email: "admin@example.invalid", name: "Admin" };
const expert = { sub: "x1", role: "EXPERT", email: "x@example.invalid", name: "Test Expert" };

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  db.expertProfile.update.mockImplementation(async () => ({ updatedAt: new Date() }));
  db.expert.update.mockImplementation(async (args: unknown) => args);
});

describe("notes policy", () => {
  it("is not a practitioner's to change", async () => {
    session.current = expert;
    const res = await setNotesPolicy(request("/api/admin/experts/e1/notes-policy", { policy: "APPROVED" }), {
      params: { id: "e1" },
    });
    expect(res.status).toBe(403);
    expect(db.expertProfile.update).not.toHaveBeenCalled();
  });

  it("needs a login to attach to", async () => {
    session.current = admin;
    db.expert.findUnique.mockResolvedValue({ slug: "test-expert", name: "Test Expert" });
    db.expertProfile.findUnique.mockResolvedValue(null);
    const res = await setNotesPolicy(request("/api/admin/experts/e1/notes-policy", { policy: "APPROVED" }), {
      params: { id: "e1" },
    });
    expect(res.status).toBe(404);
  });

  it("rejects a policy that does not exist", async () => {
    session.current = admin;
    const res = await setNotesPolicy(request("/api/admin/experts/e1/notes-policy", { policy: "MAYBE" }), {
      params: { id: "e1" },
    });
    expect(res.status).toBe(422);
  });

  it("is set by an admin and written to the audit trail", async () => {
    session.current = admin;
    db.expert.findUnique.mockResolvedValue({ slug: "test-expert", name: "Test Expert" });
    db.expertProfile.findUnique.mockResolvedValue({ id: "p1", notesPolicy: "PENDING" });

    const res = await setNotesPolicy(
      request("/api/admin/experts/e1/notes-policy", { policy: "APPROVED", note: "Agreement countersigned." }),
      { params: { id: "e1" } }
    );

    expect(res.status).toBe(200);
    expect(db.expertProfile.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { notesPolicy: "APPROVED", notesPolicyNote: "Agreement countersigned." },
    });
    expect(record).toHaveBeenCalledWith(
      admin,
      "expert.notes-policy",
      { type: "expert", id: "test-expert" },
      expect.any(String),
      { from: "PENDING", to: "APPROVED" }
    );
  });
});

describe("practitioner's own profile", () => {
  const body = {
    headline: "CBT for anxiety and burnout, in Hindi",
    bio: "I work with students and young professionals on anxiety, sleep and the pressure of exams and first jobs.",
    experienceYears: 7,
    timezone: "Asia/Kolkata",
    specialties: ["Anxiety", "Sleep"],
    languages: ["English", "Hindi"],
    // not theirs to set: must be ignored
    credentials: "PhD, self-declared",
  };

  beforeEach(() => {
    session.current = expert;
    db.expertProfile.findUnique.mockResolvedValue({ id: "p1", expertId: "test-expert" });
  });

  it("writes their half to the listing clients see, and never the qualification", async () => {
    db.expert.findUnique.mockResolvedValue({ id: "e1", status: "ACTIVE", specialties: "[]", languages: "[]" });

    const res = await saveExpertProfile(request("/api/expert/profile", body));

    expect(res.status).toBe(200);
    const listingWrite = db.expert.update.mock.calls[0][0];
    expect(listingWrite.where).toEqual({ id: "e1" });
    expect(listingWrite.data).toMatchObject({
      bio: body.bio,
      experienceYears: 7,
      specialties: JSON.stringify(["Anxiety", "Sleep"]),
      languages: JSON.stringify(["English", "Hindi"]),
    });
    expect(listingWrite.data).not.toHaveProperty("credentials");
    expect(db.expertProfile.update.mock.calls[0][0].data).toEqual({
      headline: body.headline,
      timezone: "Asia/Kolkata",
    });
  });

  it("keeps a focus area an admin typed that is not on the standard list", async () => {
    db.expert.findUnique.mockResolvedValue({
      id: "e1",
      status: "HIDDEN",
      specialties: JSON.stringify(["Postpartum care"]),
      languages: "[]",
    });

    const res = await saveExpertProfile(
      request("/api/expert/profile", { ...body, specialties: ["Anxiety", "Postpartum care"] })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).message).toMatch(/publish/);
  });

  it("still refuses a focus area that is on neither list", async () => {
    db.expert.findUnique.mockResolvedValue({ id: "e1", status: "ACTIVE", specialties: "[]", languages: "[]" });

    const res = await saveExpertProfile(request("/api/expert/profile", { ...body, specialties: ["Astrology"] }));

    expect(res.status).toBe(400);
    expect(db.expert.update).not.toHaveBeenCalled();
  });
});

describe("admin listing rules", () => {
  const draft = (over: Partial<ExpertDraft> = {}): ExpertDraft => ({
    ...emptyExpertDraft,
    name: "Test Expert",
    credentials: "M.A. Clinical Psychology",
    profession: "CLINICAL_PSYCHOLOGIST",
    photo: "/experts/test.jpg",
    loginEmail: "x@example.invalid",
    ...over,
  });

  it("creates a hidden listing without the practitioner's half", () => {
    expect(emptyExpertDraft.status).toBe("HIDDEN");
    expect(validateExpert(draft(), { creating: true })).toEqual({});
  });

  it("needs a login and a checked qualification to create one", () => {
    const f = validateExpert(draft({ loginEmail: "", credentials: "" }), { creating: true });
    expect(f).toHaveProperty("loginEmail");
    expect(f).toHaveProperty("credentials");
  });

  it("cannot list it until languages and focus areas exist", () => {
    const f = validateExpert(draft({ status: "ACTIVE" }));
    expect(f).toHaveProperty("languages");
    expect(f).toHaveProperty("specialties");
    expect(validateExpert(draft({ status: "ACTIVE", languages: ["Hindi"], specialties: ["Anxiety"] }))).toEqual({});
  });
});
