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

type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Where "Reply" goes, when that is not the sender (a visitor writing to us). */
  replyTo?: string;
};

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
    replyTo: email.replyTo,
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
      reply_to: email.replyTo,
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
    <p style="color:#1A5A4D;margin:0 0 24px">Your emotions matter.</p>
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

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  link: string
): Promise<DeliveryResult> {
  const subject = "Reset your Emoraa password";
  const text = `Hi ${name}, here is your link to set a new Emoraa password: ${link} (it expires in 1 hour and works once). If you didn't ask for it, ignore this email — your password stays as it is.`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Your emotions matter.</p>
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">Let's get you back in, ${esc(name)}.</h1>
    <p style="line-height:1.6;color:#3a4a44">Choose a new password with the button below.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Set a new password</a>
    </p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">Or paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">This link expires in 1 hour and can be used once. If you didn't ask for it, ignore this email — your password stays as it is.</p>
  </div>`;

  return deliver({ to, subject, html, text }, link);
}

/**
 * The email that turns a catalogue listing into somebody who can sign in.
 *
 * It is deliberately not the password-reset mail. A practitioner who never
 * asked for an account and gets "Reset your Emoraa password" reasonably reads
 * it as a phishing attempt and deletes it, and then an admin is left wondering
 * why the invite "didn't arrive". This one says who added them, what the
 * account is for, and what happens when they click.
 */
export async function sendExpertInviteEmail(
  to: string,
  name: string,
  link: string,
  hours: number
): Promise<DeliveryResult> {
  const subject = "Your Emoraa practitioner account";
  const text = `Hi ${name}, an Emoraa admin has set up a practitioner account for you (${to}). Choose your password here to activate it: ${link} — the link works once and expires in ${hours} hours. Once you are in, you'll see your sessions, your availability and your clients. If you weren't expecting this, tell us at connect@emoraa.com and we'll remove the account.`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Your emotions matter.</p>
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">Welcome, ${esc(name)}.</h1>
    <p style="line-height:1.6;color:#3a4a44">An Emoraa admin has set up a practitioner account for you at <strong>${esc(to)}</strong>. Choose a password and it is yours — we never see it.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Choose my password</a>
    </p>
    <p style="line-height:1.6;color:#3a4a44">Once you're in you'll find your upcoming sessions, the hours you're available, and the clients you're seeing.</p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">Or paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">The link works once and expires in ${hours} hours. If you weren't expecting this, reply to this email or write to connect@emoraa.com and we'll remove the account.</p>
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
        <p style="color:#1A5A4D;margin:0 0 24px">Your emotions matter.</p>
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
 * The 6-digit code that proves a visitor owns the address they are writing
 * from. It goes to an address nobody has proven yet, so it says plainly what
 * triggered it and that ignoring it is safe.
 */
export async function sendContactCode(
  to: string,
  name: string,
  code: string
): Promise<{ delivered: boolean; devCode?: string }> {
  const subject = `${code} is your Emoraa code`;
  const text = `Hi ${name}, your code is ${code}. Enter it on the Emoraa website to send your message. It expires in 10 minutes. If you didn't write to us, ignore this email; nothing will be sent.`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Your emotions matter.</p>
    <h1 style="font-size:22px;color:#0A2E28;margin:0 0 12px">Hi ${esc(name)}, here is your code.</h1>
    <p style="line-height:1.6;color:#3a4a44">Enter it on the website to send your message.</p>
    <p style="margin:24px 0;font-family:Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:8px;color:#0A2E28">${code}</p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">It expires in 10 minutes. If you didn't write to us, ignore this email; nothing will be sent.</p>
  </div>`;

  if (await push({ to, subject, text, html })) return { delivered: true };

  console.log(["", "  📧  No mail provider configured — contact code not sent.", `      Code: ${code}`, ""].join("\n"));
  return { delivered: false, devCode: isProduction ? undefined : code };
}

export type ContactMessage = { name: string; email: string; message: string };

/**
 * A visitor writing to us from the site, through the contact form or the
 * composer that opens when they click our address.
 *
 * It lands in the team inbox with Reply-To set to the visitor, so answering is
 * just pressing Reply. There is deliberately no acknowledgement email: this
 * endpoint takes any address, and an automatic reply would let anyone use us to
 * send mail to a stranger. The page confirms instead.
 */
export async function sendContactMessage(
  m: ContactMessage
): Promise<{ delivered: boolean; devFallback?: string }> {
  const to = enquiryInbox();
  const text = `From: ${m.name} <${m.email}>\n\n${m.message}`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">New message from the website</p>
    <p style="color:#7a857f;margin:0 0 24px;font-size:14px">${esc(m.name)} &lt;${esc(m.email)}&gt; · press Reply to answer</p>
    <p style="line-height:1.7;color:#1F2D28;white-space:pre-wrap;margin:0">${esc(m.message)}</p>
  </div>`;

  if (!to) {
    console.log(["", "  [contact] received, but no inbox is configured:", text, ""].join("\n"));
    return { delivered: false, devFallback: isProduction ? undefined : text };
  }

  await push({ to, replyTo: m.email, subject: `Website message from ${m.name}`, text, html });
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

/* ------------------------------------------------------------------ *
 * The request-first booking flow
 * ------------------------------------------------------------------ */

const shell = (body: string) => `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">Emoraa</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Your emotions matter.</p>
    ${body}
    <p style="font-size:13px;color:#7a857f;line-height:1.6;margin-top:28px">Emoraa is not a crisis service. If you need someone right now, Tele-MANAS is on <strong>14416</strong>, free, 24×7, in 20+ Indian languages.</p>
  </div>`;

/** A practitioner has agreed to the time. Now, and only now, we ask for money. */
export async function sendBookingAcceptedEmail(args: {
  to: string;
  clientName: string;
  expertName: string;
  when: string;
  link: string;
  amount: number;
  free: boolean;
}): Promise<DeliveryResult> {
  const { to, clientName, expertName, when, link, amount, free } = args;
  const subject = `${expertName} accepted your session — ${when}`;
  const ask = free
    ? "There is nothing to pay for your first session. Confirm it and the time is yours."
    : `The fee is ₹${amount}. Your place is held until you pay.`;
  const text = `Hi ${clientName}, ${expertName} has accepted your session on ${when}. ${ask} ${link}`;
  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">${esc(expertName)} said yes.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(clientName)} — your session on <strong>${esc(when)}</strong> has been accepted.</p>
    <p style="line-height:1.6;color:#3a4a44">${esc(ask)}</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">${free ? "Confirm my session" : "Pay and confirm"}</a>
    </p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">Or paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>`),
    },
    link
  );
}

/**
 * A practitioner has said no.
 *
 * The practitioner's own words are NOT repeated here. A note written for the
 * clinical record is not a message to the person it is about, and "not a good
 * fit for my caseload" reads very differently to the person reading it about
 * themselves. They get the fact, the reassurance that nothing was charged, and
 * a way forward.
 */
export async function sendBookingDeclinedEmail(args: {
  to: string;
  clientName: string;
  when: string;
  link: string;
}): Promise<DeliveryResult> {
  const { to, clientName, when, link } = args;
  const subject = "About your session request";
  const text = `Hi ${clientName}, we're sorry — the therapist isn't able to take your session on ${when}. Nothing has been charged. There are other practitioners with time, and we can help you find one: ${link}`;
  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">We couldn't hold that time.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(clientName)} — we're sorry. The therapist isn't able to take your session on <strong>${esc(when)}</strong>.</p>
    <p style="line-height:1.6;color:#3a4a44"><strong>Nothing has been charged.</strong> This happens for all sorts of practical reasons, and it is not a judgement about you.</p>
    <p style="line-height:1.6;color:#3a4a44">Other practitioners have time this week, and we can help you find someone who fits.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Find another time</a>
    </p>`),
    },
    link
  );
}

/**
 * The practitioner cancelled a confirmed session.
 *
 * As with a decline, their reason is for the record and is not repeated here.
 * What the client needs is the fact, what happens to their money (all of it
 * back — they did nothing wrong), and a way to rebook.
 */
export async function sendSessionCancelledEmail(args: {
  to: string;
  clientName: string;
  when: string;
  link: string;
  /** Rupees refunded; 0 for a free session or when nothing was charged. */
  refunded: number;
  /** The refund could not be sent automatically and will follow by hand. */
  refundPending: boolean;
  /** It was their free session, and it is theirs to book again. */
  freeSessionReturned: boolean;
}): Promise<DeliveryResult> {
  const { to, clientName, when, link, refunded, refundPending, freeSessionReturned } = args;
  const money = refundPending
    ? "We'll refund your fee in full; our team is sending it and will let you know."
    : refunded > 0
      ? `Your fee of ₹${refunded} is being refunded in full. It usually lands in 5–7 working days.`
      : freeSessionReturned
        ? "This was your free session, so it's yours to book again."
        : "Nothing was charged for this session.";
  const subject = "Your session has been cancelled";
  const text = `Hi ${clientName}, we're sorry — your therapist had to cancel your session on ${when}. ${money} You can book another time here: ${link}`;
  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">Your session has been cancelled.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(clientName)} — we're sorry. Your therapist had to cancel your session on <strong>${esc(when)}</strong>.</p>
    <p style="line-height:1.6;color:#3a4a44"><strong>${esc(money)}</strong></p>
    <p style="line-height:1.6;color:#3a4a44">This was not anything you did. When you're ready, pick another time — with them or with someone else.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Book another time</a>
    </p>`),
    },
    link
  );
}

/** The practitioner suggesting another session, in their own words. */
export async function sendFollowUpEmail(args: {
  to: string;
  clientName: string;
  expertName: string;
  message: string;
  link: string;
}): Promise<DeliveryResult> {
  const { to, clientName, expertName, message, link } = args;
  const subject = `${expertName} suggested another session`;
  const text = `Hi ${clientName}, ${expertName} suggested booking another session.${message ? ` They said: "${message}"` : ""} Book whenever you're ready: ${link}`;
  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">${esc(expertName)} suggested another session.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(clientName)} — no rush, and no obligation. Book when it suits you.</p>
    ${message ? `<blockquote style="margin:20px 0;padding:14px 18px;border-left:3px solid #C8A45D;background:#F7F4EC;line-height:1.6;color:#3a4a44">${esc(message)}</blockquote>` : ""}
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Book a session</a>
    </p>`),
    },
    link
  );
}

/**
 * A practitioner has issued a document on a session: a prescription or a
 * practice plan.
 *
 * The email says THAT something is ready and links to it behind sign-in. It
 * never carries the content — no medicine names, no tasks — because an inbox
 * is read on shared laptops and lock screens, and a medicine name in a preview
 * line tells whoever glances at it more than the client chose to share.
 */
export async function sendDocumentIssuedEmail(args: {
  to: string;
  clientName: string;
  expertName: string;
  kind: "prescription" | "plan";
  link: string;
}): Promise<DeliveryResult> {
  const { to, clientName, expertName, kind, link } = args;
  const what = kind === "prescription" ? "a prescription" : "a practice plan";
  const subject = `${expertName} shared ${what} with you`;
  const text = `Hi ${clientName}, ${expertName} has shared ${what} from your session. Sign in to view, print or save it: ${link}`;
  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">${esc(expertName)} shared ${what}.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(clientName)} — it's from your session and waiting in your Emoraa account. Sign in to view it, print it or save it as a PDF.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">View ${kind === "prescription" ? "prescription" : "plan"}</a>
    </p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">For your privacy, we never put what it says in an email.</p>`),
    },
    link
  );
}

/** A new request is waiting on a practitioner. */
export async function sendRequestAlertEmail(args: {
  to: string;
  expertName: string;
  when: string;
  hours: number;
  link: string;
}): Promise<DeliveryResult> {
  const { to, expertName, when, hours, link } = args;
  const subject = `New session request — ${when}`;
  const text = `Hi ${expertName}, somebody has asked for a session on ${when}. The slot is held for them for ${hours} hours while you decide. Accept or decline here: ${link}`;
  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">A new request.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(expertName)} — somebody has asked for a session on <strong>${esc(when)}</strong>.</p>
    <p style="line-height:1.6;color:#3a4a44">Their slot is held for the next ${hours} hours while you decide. Nothing has been charged to them yet.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Review the request</a>
    </p>`),
    },
    link
  );
}

/** A practitioner needing to move a session, offering times that work instead. */
export async function sendRescheduleOfferEmail(args: {
  to: string;
  clientName: string;
  expertName: string;
  was: string;
  reason: string;
  options: { date: string; times: string[] }[];
  link: string;
}): Promise<DeliveryResult> {
  const { to, clientName, expertName, was, reason, options, link } = args;
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(`${d}T00:00:00+05:30`));

  const lines = options.map((o) => `${fmt(o.date)}: ${o.times.join(" or ")}`);
  const subject = `${expertName} needs to move your session`;
  const text = `Hi ${clientName}, ${expertName} can no longer make ${was}. They said: "${reason}". Times that would work instead — ${lines.join("; ")}. Pick one here: ${link}. If none suit, your original time still stands until you choose.`;

  return deliver(
    {
      to,
      subject,
      text,
      html: shell(`
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">A change of time.</h1>
    <p style="line-height:1.6;color:#3a4a44">Hi ${esc(clientName)} — ${esc(expertName)} can no longer make <strong>${esc(was)}</strong>.</p>
    <blockquote style="margin:18px 0;padding:14px 18px;border-left:3px solid #C8A45D;background:#F7F4EC;line-height:1.6;color:#3a4a44">${esc(reason)}</blockquote>
    <p style="line-height:1.6;color:#3a4a44">These would work instead:</p>
    <ul style="line-height:1.9;color:#3a4a44;padding-left:20px">
      ${options.map((o) => `<li><strong>${esc(fmt(o.date))}</strong> — ${esc(o.times.join(" or "))}</li>`).join("")}
    </ul>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Pick a time</a>
    </p>
    <p style="line-height:1.6;color:#3a4a44">Nothing has changed yet, and you have not been charged anything further. If none of these suit, leave it — your original time stands until you choose, and you can tell us and we will sort something out.</p>`),
    },
    link
  );
}
