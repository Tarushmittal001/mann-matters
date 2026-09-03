type SmsResult = { sent: true } | { sent: false; reason: string };

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  return accountSid && authToken && from ? { accountSid, authToken, from } : null;
}

export function hasSmsProvider() {
  return !!twilioConfig();
}

export async function sendSignInOtp(phone: string, code: string): Promise<SmsResult> {
  const config = twilioConfig();
  if (!config) return { sent: false, reason: "SMS delivery is not configured." };

  const body = new URLSearchParams({
    To: phone,
    From: config.from,
    Body: `${code} is your Emoraa sign-in code. It expires in 5 minutes. Do not share it.`,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );

  return response.ok
    ? { sent: true }
    : { sent: false, reason: `Twilio returned ${response.status}.` };
}