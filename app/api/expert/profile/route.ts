import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  LANGUAGE_OPTIONS,
  MAX_BIO,
  MAX_HEADLINE,
  MAX_LANGUAGES,
  MAX_SPECIALTIES,
  SPECIALTY_OPTIONS,
  isSupportedTimezone,
  stringifyList,
} from "@/lib/expert-portal";

/**
 * PATCH /api/expert/profile
 *
 * The practitioner owns how they are described. They do not own session
 * length, fee, notes policy or verification status — those are set by ops and
 * are read-only in the portal, so this route simply never reads them off the
 * request body.
 */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "EXPERT" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  const profile = await prisma.expertProfile.findUnique({ where: { userId: session.sub } });
  if (!profile) {
    return NextResponse.json({ error: "Your practitioner record is not linked yet." }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const headline = typeof payload.headline === "string" ? payload.headline.trim() : "";
  const bio = typeof payload.bio === "string" ? payload.bio.trim() : "";
  const credentials = typeof payload.credentials === "string" ? payload.credentials.trim() : "";
  const experienceYears = Number(payload.experienceYears);
  const timezone = payload.timezone;
  const specialties = Array.isArray(payload.specialties) ? payload.specialties : null;
  const languages = Array.isArray(payload.languages) ? payload.languages : null;

  const fields: Record<string, string> = {};

  if (headline.length < 12) fields.headline = "Give clients one line about how you work.";
  else if (headline.length > MAX_HEADLINE) fields.headline = "Keep the headline under " + MAX_HEADLINE + " characters.";

  if (bio.length < 60) fields.bio = "A short paragraph helps people choose. Aim for 60 characters or more.";
  else if (bio.length > MAX_BIO) fields.bio = "Keep the introduction under " + MAX_BIO + " characters.";

  if (credentials.length < 4) fields.credentials = "Add your qualification, as it appears on your registration.";

  if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 60) {
    fields.experienceYears = "Years of practice should be between 0 and 60.";
  }

  if (!isSupportedTimezone(timezone)) {
    fields.timezone = "Pick a timezone from the list.";
  }

  if (!specialties || specialties.length === 0) {
    fields.specialties = "Pick at least one focus area.";
  } else if (specialties.length > MAX_SPECIALTIES) {
    fields.specialties = "Up to " + MAX_SPECIALTIES + " focus areas — the rest belongs in your introduction.";
  } else if (specialties.some((s) => typeof s !== "string" || !SPECIALTY_OPTIONS.includes(s))) {
    fields.specialties = "One of those focus areas is not on our list.";
  }

  if (!languages || languages.length === 0) {
    fields.languages = "Pick at least one language you hold sessions in.";
  } else if (languages.length > MAX_LANGUAGES) {
    fields.languages = "Up to " + MAX_LANGUAGES + " languages.";
  } else if (languages.some((l) => typeof l !== "string" || !LANGUAGE_OPTIONS.includes(l))) {
    fields.languages = "One of those languages is not on our list.";
  }

  if (Object.keys(fields).length > 0) {
    return NextResponse.json(
      { error: "Some fields need another look.", fields },
      { status: 400 }
    );
  }

  const updated = await prisma.expertProfile.update({
    where: { id: profile.id },
    data: {
      headline,
      bio,
      credentials,
      experienceYears: Math.round(experienceYears),
      timezone: timezone as string,
      specialties: stringifyList(specialties as string[]),
      languages: stringifyList(languages as string[]),
    },
  });

  return NextResponse.json({
    updatedAt: updated.updatedAt.toISOString(),
    message: "Profile saved. Your listing updates for new clients right away.",
  });
}
