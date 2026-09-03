import { NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 1000;
const CRISIS_TERMS = [
  "suicide",
  "kill myself",
  "end my life",
  "self harm",
  "self-harm",
  "hurt myself",
  "can't go on",
  "cannot go on",
];

function replyFor(message: string) {
  const normalized = message.toLowerCase();
  if (CRISIS_TERMS.some((term) => normalized.includes(term))) {
    return "I am really sorry you are carrying this right now. Manu is not a crisis service. Please call Tele-MANAS at 14416 for free, confidential, 24x7 support, or call 112 if you may be in immediate danger. You can also go to /crisis for more options.";
  }
  if (/sleep|insomnia|neend/.test(normalized)) {
    return "That sounds exhausting. For tonight, try putting the phone away, taking a few slow breaths, and allowing rest without forcing sleep. A counsellor can help you explore what is keeping your mind alert.";
  }
  if (/anxious|anxiety|panic|ghabra/.test(normalized)) {
    return "It makes sense that this feels heavy. Try naming five things you can see and taking one slower breath than the last. You do not have to solve everything in this moment.";
  }
  return "Thank you for putting that into words. You do not have to make it sound neat here. A small next step could be telling someone you trust or booking a confidential session with a counsellor.";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  return NextResponse.json({ reply: replyFor(message) });
}
