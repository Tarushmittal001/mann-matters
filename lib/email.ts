import nodemailer from "nodemailer";

/**
 * Email delivery, with three providers tried in order:
 *
 *  1. **Gmail SMTP** — `GMAIL_USER` + `GMAIL_APP_PASSWORD`. This is the only
 *     option that can genuinely send *from* a @gmail.com address, because
 *     Google is the one authorising it. Needs an App Password, not the account
 *     password (see .env.example).
 *  2. **Resend** — `RESEND_API_KEY`. Note that Resend cannot send from a gmail
 *     address: it will only send from a domain you have verified with them, so
 *     `EMAIL_FROM` must be on that domain (or `onboarding@resend.dev`).
 *  3. **Neither configured** — the message is logged to the server console and,
 *     in development only, the link is handed back to the caller so the UI can
 *     show it. Signup is otherwise a dead end on a fresh machine.
 */

type Email = { to: string; subject: string; html: string; text: string };

export type DeliveryResult = {
  /** True when a provider actually accepted the message. */
  delivered: boolean;
  /** Which provider handled it, for logging. */
  via: "gmail" | "resend" | "console";
  /**
   * The raw verification link — populated ONLY when nothing is configured AND
   * we are not in production. It exists so a developer isn't locked out of
   * their own signup flow; it must never reach a real user.
   */
  devLink?: string;
};

const isProduction = process.env.NODE_ENV === "production";

function gmailCreds() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""); // Google shows it in groups of 4
  return user && pass ? { user, pass } : null;
}

/** The From header. Gmail requires it to be the authenticated account itself. */
function fromAddress(): string {
  const creds = gmailCreds();
  if (creds) return `Emoraa <${creds.user}>`;
  return process.env.EMAIL_FROM?.trim() || "Emoraa <onboarding@resend.dev>";
}

async function viaGmail(email: Email): Promise<boolean> {
  const creds = gmailCreds();
  if (!creds) return false;

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: creds.user, pass: creds.pass },
  });

  await transport.sendMail({
    from: fromAddress(),
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  return true;
}

async function viaResend(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress(),
      to: email.to,
      subject: email.subject,
      html: email.html,
    }),
  });
  if (!res.ok) {
    // the body can echo the recipient, so only the status is safe to surface
    throw new Error(`Resend rejected the message (${res.status})`);
  }
  return true;
}

/**
 * Push one message through the provider chain. Returns which provider took it,
 * or null when nothing is configured (the caller decides what to do about that).
 */
async function push(email: Email): Promise<"gmail" | "resend" | null> {
  if (gmailCreds()) {
    await viaGmail(email);
    return "gmail";
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    await viaResend(email);
    return "resend";
  }
  return null;
}

async function deliver(email: Email, link: string): Promise<DeliveryResult> {
  if (gmailCreds()) {
    await viaGmail(email);
    return { delivered: true, via: "gmail" };
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    await viaResend(email);
    return { delivered: true, via: "resend" };
  }

  // nothing configured — make the link impossible to miss in the terminal
  console.log(
    [
      "",
      "  📧  No mail provider configured (set GMAIL_USER + GMAIL_APP_PASSWORD).",
      `      To:      ${email.to}`,
      `      Subject: ${email.subject}`,
      `      Link:    ${link}`,
      "",
    ].join("\n")
  );

  return {
    delivered: false,
    via: "console",
    // never hand a live verification link to a client in production
    devLink: isProduction ? undefined : link,
  };
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  link: string
): Promise<DeliveryResult> {
  const subject = "Confirm your email · Emoraa";
  const text = `Hi ${name}, confirm your email to finish setting up your Emoraa account: ${link} (the link expires in 24 hours).`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Your mind matters.</p>
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">One last step, ${name}.</h1>
    <p style="line-height:1.6;color:#3a4a44">Confirm your email address to finish setting up your account and start booking sessions.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Confirm my email</a>
    </p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">Or paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  </div>`;

  return deliver({ to, subject, html, text }, link);
}

/** Whether any real provider is wired up — used to tailor the signup screen. */
export function mailerConfigured(): boolean {
  return !!gmailCreds() || !!process.env.RESEND_API_KEY?.trim();
}

/* ------------------------------------------------------------------ *
 * Institution enquiries
 * ------------------------------------------------------------------ */

export type PackEnquiry = {
  institution: string;
  segment: string;
  headcount: string;
  components: string[];
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
};

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Where enquiries land. `site.email` is the published address, but it only
 * receives once that domain has real MX records — so the working inbox wins
 * until it does, and nothing silently bounces in the meantime.
 */
function enquiryInbox(): string | null {
  return (
    process.env.ENQUIRY_TO?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
    null
  );
}

/**
 * Notify the team, and acknowledge the person who asked. The acknowledgement is
 * best-effort: an institution's enquiry must never be lost because their own
 * mail server was slow to accept our courtesy reply.
 */
export async function sendPackEnquiry(
  e: PackEnquiry
): Promise<{ delivered: boolean; devFallback?: string }> {
  const to = enquiryInbox();
  const rows: [string, string][] = [
    ["Institution", e.institution],
    ["Type", e.segment],
    ["Size", e.headcount],
    ["Pack requested", e.components.length ? e.components.join(", ") : "— (not specified)"],
    ["Contact", e.contactName],
    ["Email", e.email],
    ["Phone", e.phone || "—"],
    ["Context", e.message || "—"],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 20px">New program enquiry</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 12px 8px 0;color:#7a857f;vertical-align:top;white-space:nowrap">${esc(
              k
            )}</td><td style="padding:8px 0;color:#1F2D28">${esc(v)}</td></tr>`
        )
        .join("")}
    </table>
  </div>`;

  if (!to) {
    console.log(["", "  [enquiry] received, but no inbox is configured:", text, ""].join("\n"));
    return { delivered: false, devFallback: isProduction ? undefined : text };
  }

  await push({ to, subject: `Program enquiry — ${e.institution}`, text, html });

  // courtesy acknowledgement; never allowed to fail the request
  try {
    await push({
      to: e.email,
      subject: "We've got your enquiry · Emoraa",
      text: `Hi ${e.contactName}, thanks for telling us about ${e.institution}. Someone from our team will reply within one working day. If it's urgent, just reply to this email.`,
      html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
        <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
        <p style="color:#1A5A4D;margin:0 0 24px">Your mind matters.</p>
        <h1 style="font-size:22px;color:#0A2E28;margin:0 0 12px">Thanks, ${esc(e.contactName)}.</h1>
        <p style="line-height:1.6;color:#3a4a44">We've got your note about <strong>${esc(
          e.institution
        )}</strong>. A real person will read it and reply within one working day — no bot, no sales sequence.</p>
        <p style="line-height:1.6;color:#3a4a44">If something is urgent in the meantime, just reply to this email.</p>
      </div>`,
    });
  } catch {
    // the enquiry itself is already safely delivered
  }

  return { delivered: true };
}

/**
 * A one-off "this is what a notification looks like" email, sent from the
 * expert portal. Returns whether it actually left the building — with no
 * provider configured it is logged to the console instead, and the portal says
 * so rather than claiming a delivery that never happened.
 */
export async function sendExpertTestNotification(to: string, name: string): Promise<boolean> {
  const subject = "Test notification · Emoraa expert portal";
  const text = `Hi ${name}, this is the test notification you asked for from your expert portal. Real alerts about bookings, cancellations and reminders arrive looking like this.`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Expert portal</p>
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">Your notifications are working, ${name}.</h1>
    <p style="line-height:1.6;color:#3a4a44">This is a test you triggered yourself. Alerts about new bookings, cancellations and session reminders arrive here, looking like this.</p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">Change what reaches you, and when, from Notifications in the expert portal.</p>
  </div>`;

  const via = await push({ to, subject, html, text });
  if (via) return true;

  console.log(
    [
      "",
      "  📧  No mail provider configured — test notification not sent.",
      `      To:      ${to}`,
      `      Subject: ${subject}`,
      "",
    ].join("\n")
  );
  return false;
}
