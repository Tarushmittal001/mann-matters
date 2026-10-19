import { prisma } from "@/lib/db";
import { record } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { normaliseCode } from "@/lib/coupons";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Body = {
  code?: string;
  kind?: string;
  value?: number | string;
  note?: string;
  maxUses?: number | string | null;
  expiresAt?: string | null;
};

/** A code people type off a poster or a screenshot: letters, digits and dashes only. */
const CODE_SHAPE = /^[A-Z0-9-]{4,24}$/;

/**
 * POST /api/admin/coupons — make a discount code.
 *
 * Validation is strict on purpose. A 200%-off code, a code that expires in the
 * past, or a code with a space in it are all things that surface as a confused
 * client on the payment screen rather than as an error here.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const fields: Record<string, string> = {};

    const code = normaliseCode(String(body.code ?? ""));
    if (!CODE_SHAPE.test(code)) {
      fields.code = "4–24 characters: letters, numbers and dashes.";
    }

    const kind = body.kind === "PERCENT" ? "PERCENT" : "FIXED";
    const value = Math.floor(Number(body.value));
    if (!Number.isFinite(value) || value <= 0) {
      fields.value = "How much comes off? A number above zero.";
    } else if (kind === "PERCENT" && value > 90) {
      fields.value = "90% is the most a percentage code may take off.";
    } else if (kind === "FIXED" && value > 10000) {
      fields.value = "₹10,000 is the most a fixed code may take off.";
    }

    const maxUsesRaw = body.maxUses;
    let maxUses: number | null = null;
    if (maxUsesRaw !== null && maxUsesRaw !== undefined && String(maxUsesRaw).trim() !== "") {
      maxUses = Math.floor(Number(maxUsesRaw));
      if (!Number.isFinite(maxUses) || maxUses <= 0) {
        fields.maxUses = "Leave it empty for unlimited, or give a number above zero.";
      }
    }

    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      // a date, read as the end of that day in clinic time
      expiresAt = new Date(`${body.expiresAt}T23:59:59+05:30`);
      if (Number.isNaN(expiresAt.getTime())) {
        fields.expiresAt = "That isn't a date we can read.";
      } else if (expiresAt.getTime() < Date.now()) {
        fields.expiresAt = "That date has already passed.";
      }
    }

    if (Object.keys(fields).length) return errors.validation(fields);

    const existing = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
    if (existing) {
      return errors.validation({ code: "There is already a code with that name." });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        kind,
        value,
        note: String(body.note ?? "").slice(0, 200),
        maxUses,
        expiresAt,
        status: "ACTIVE",
      },
    });

    await record(
      session,
      "coupon.create",
      { type: "coupon", id: coupon.code },
      `Created discount code ${coupon.code}`
    );

    return privateJson({ coupon: { id: coupon.id, code: coupon.code } });
  } catch (err) {
    logFailure("admin.coupons.create", err);
    return errors.server();
  }
}
