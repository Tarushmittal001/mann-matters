/**
 * Minimal, pluggable email sender. If RESEND_API_KEY is set it sends a real
 * email via Resend's REST API (no SDK needed). Otherwise — in local dev — it
 * logs the message to the server console so you can follow the link by hand.
 */

type Email = { to: string; subject: string; html: string; text: string };

const FROM = process.env.EMAIL_FROM || "mann Matters <onboarding@resend.dev>";

async function deliver(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // dev fallback — make the link impossible to miss in the terminal
    console.log(
      [
        "",
        "📧  [dev] Email not sent (no RESEND_API_KEY). Contents below:",
        `    To:      ${email.to}`,
        `    Subject: ${email.subject}`,
        `    ${email.text}`,
        "",
      ].join("\n")
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: email.to, subject: email.subject, html: email.html }),
  });
  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
  }
}

export async function sendVerificationEmail(to: string, name: string, link: string) {
  const subject = "Confirm your email · mann Matters";
  const text = `Hi ${name}, confirm your email to finish setting up your mann Matters account: ${link} (the link expires in 24 hours).`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#1F2D28">
    <p style="font-size:20px;font-weight:600;color:#0A2E28;margin:0 0 4px">mann Matters</p>
    <p style="color:#1A5A4D;margin:0 0 24px">Your mind matters.</p>
    <h1 style="font-size:24px;color:#0A2E28;margin:0 0 12px">One last step, ${name}.</h1>
    <p style="line-height:1.6;color:#3a4a44">Confirm your email address to finish setting up your account and start booking sessions.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#C8A45D;color:#06211C;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">Confirm my email</a>
    </p>
    <p style="font-size:13px;color:#7a857f;line-height:1.6">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  </div>`;
  await deliver({ to, subject, html, text });
}
