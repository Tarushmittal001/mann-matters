import { FREE_CHANGE_HOURS, MAX_RESCHEDULES, SESSION_MINUTES } from "@/lib/features/booking/policy";
import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { languageList } from "@/lib/languages";
import { crisisReply } from "@/lib/manu-safety";
import { priceLine } from "@/lib/price-claims";
import { launchEndsLabel } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 1000;
/** A reply Manu wrote; the client sends it back as history, so it is capped too. */
const MAX_REPLY_LENGTH = 2000;
/** Turns of history sent to the model. Older ones drop off the front. */
const MAX_TURNS = 16;

/*
 * The facts Manu may state, read from the same modules the pages use, so a
 * price or a language can never say one thing in the chat and another on the
 * site. Built once per server start, so the system prompt is byte-identical
 * on every request.
 */
const FACTS = [
  `Prices: ${priceLine()}. Launch pricing runs until ${launchEndsLabel()}. The first session is free, once per person, after verifying a phone number.`,
  `Sessions are ${SESSION_MINUTES} minutes, one to one over video, with ${site.practitionerWord} psychologists, and a psychiatrist for medication.`,
  `Languages offered: ${languageList()}.`,
  `A booking can be moved or cancelled up to ${FREE_CHANGE_HOURS} hours before it starts, and moved at most ${MAX_RESCHEDULES} times.`,
  `Free tools, no payment: breathing (/breathe), grounding (/tools/grounding) and muscle relaxation (/tools/relax) need no account; the journal, sounds, affirmations, mood check-in (/check-in) and therapist matching (/match) need a free account.`,
  `Pages: book a session at /book, therapists at /therapists, services at /services, privacy at /privacy, refunds at /refund-policy, crisis help at /crisis.`,
  `Contact: ${site.email}, phone and WhatsApp ${site.phone}.`,
].join("\n");

const SYSTEM_PROMPT = `You are Manu, the AI chat companion on Emoraa, an online therapy and counselling service for people in India.

How to talk:
- Warm, calm, plain English. Keep replies short: usually 2-4 sentences.
- If the person writes in Hindi or Hinglish, answer the same way.
- Listen first. When someone shares how they feel, reflect it back before suggesting anything, and offer one small next step at most.
- Use the conversation so far; don't ask for something they have already told you.
- Plain text only. No markdown, lists or headings.

What you are not:
- You are an AI, not a therapist and not a crisis service. Say so if asked, or if someone treats you as their therapist.
- Do not diagnose, name a condition someone "has", or advise on medication.
- If someone may be in danger or thinking about harming themselves, tell them to call Tele-MANAS on 14416 (free, 24x7) or 112 in an emergency, and point to /crisis.

Facts about Emoraa (the only ones you may state; for anything else, such as a specific therapist's availability or someone's booking, point to the right page or to ${site.email}):
${FACTS}`;

type Turn = { role: "user" | "assistant"; content: string };
type Body = { messages?: unknown; message?: unknown };
type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

/**
 * The conversation, as the client sends it. Validated rather than trusted:
 * only user/assistant turns of plain text, each capped, the most recent
 * MAX_TURNS kept, starting with the person and ending with them.
 * `{ message }` alone still works for the old single-message shape.
 */
function readTurns(body: Body): Turn[] | null {
  if (typeof body.message === "string" && body.messages === undefined) {
    return [{ role: "user", content: body.message.trim() }];
  }
  if (!Array.isArray(body.messages)) return null;
  const turns: Turn[] = [];
  for (const raw of body.messages) {
    if (!raw || typeof raw !== "object") return null;
    const { role, content } = raw as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim();
    if (!text) continue;
    if (text.length > (role === "user" ? MAX_MESSAGE_LENGTH : MAX_REPLY_LENGTH)) return null;
    turns.push({ role, content: text });
  }
  const recent = turns.slice(-MAX_TURNS);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errors.crossOrigin();

    const limited = await rateLimit("manu", clientKey(request));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(request);
    if (!body) return errors.badBody();
    const turns = readTurns(body);
    const latest = turns?.at(-1);
    if (!turns || !latest || latest.role !== "user" || !latest.content) {
      return fail(422, `Keep your message between 1 and ${MAX_MESSAGE_LENGTH} characters.`, {
        code: "BAD_MESSAGE",
      });
    }

    // crisis words get the helplines straight away, before any AI call
    const safetyResponse = crisisReply(latest.content);
    if (safetyResponse) return privateJson({ reply: safetyResponse });

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return fail(503, "Manu is taking a short pause. Please try again in a little while.", {
        code: "MANU_UNAVAILABLE",
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5",
        max_tokens: 400,
        temperature: 0.5,
        system: SYSTEM_PROMPT,
        messages: turns,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => ({}))) as AnthropicResponse;
    if (!response.ok) {
      logFailure("manu.anthropic", new Error(`Anthropic returned ${response.status}`));
      return fail(502, "Manu couldn't reply just now. Please try again.", {
        code: "MANU_UPSTREAM_ERROR",
      });
    }

    const text = data.content
      ?.filter((item) => item.type === "text" && item.text)
      .map((item) => item.text?.trim())
      .filter(Boolean)
      .join("\n")
      .slice(0, MAX_REPLY_LENGTH);
    if (!text) throw new Error("Anthropic response contained no text");

    return privateJson({ reply: { text } });
  } catch (error) {
    logFailure("manu.reply", error);
    return errors.server();
  }
}
