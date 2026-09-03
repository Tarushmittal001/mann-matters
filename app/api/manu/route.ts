import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { crisisReply } from "@/lib/manu-safety";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 1000;
const SYSTEM_PROMPT = `You are Manu, Emoraa's warm, practical mental-wellness companion for people in India.
Respond to the user's current message only; no conversation history is available.
Be concise (normally 2-4 sentences), calm, non-judgmental, and natural. You may use simple English or mirror light Hindi/Hinglish if the user does.
You are not a therapist or crisis service. Do not diagnose, prescribe, claim confidentiality guarantees, or invent prices, clinician credentials, availability, policies, or medical facts.
Offer one grounded next step. For questions requiring account, booking, price, privacy, or clinician-specific facts, direct the user to the relevant Emoraa page or a human instead of guessing.
Return plain text only.`;

type Body = { message?: string };
type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errors.crossOrigin();

    const limited = rateLimit("manu", clientKey(request));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(request);
    if (!body) return errors.badBody();
    const message = body.message?.trim() ?? "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return fail(422, `Keep your message between 1 and ${MAX_MESSAGE_LENGTH} characters.`, {
        code: "BAD_MESSAGE",
      });
    }

    const safetyResponse = crisisReply(message);
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
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-latest",
        max_tokens: 240,
        temperature: 0.5,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
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
      .slice(0, 2000);
    if (!text) throw new Error("Anthropic response contained no text");

    return privateJson({ reply: { text } });
  } catch (error) {
    logFailure("manu.reply", error);
    return errors.server();
  }
}