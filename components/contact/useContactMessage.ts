"use client";

import { useState } from "react";
import { collect, hasErrors, validateEmail, validateName } from "@/lib/validation";

type Status = "idle" | "sending" | "code" | "verifying" | "sent";

/**
 * The state and submit shared by the contact form and the email composer, so
 * both send through /api/contact and validate the same way.
 *
 * Sending is two steps unless the address is already proven: the first submit
 * emails a code (status "code"), and the message only goes out once that code
 * comes back with it.
 */
export function useContactMessage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");

  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [devFallback, setDevFallback] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const post = async (withCode: boolean) => {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        withCode ? { name, email, message, token, code } : { name, email, message }
      ),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  /** First step: validate, then send the message or ask for a code. */
  const submit = async (resending = false): Promise<boolean> => {
    // a resend stays on the code step, win or lose
    const fallback: Status = resending ? "code" : "idle";
    const local = collect([
      ["name", validateName(name)],
      ["email", validateEmail(email)],
      ["message", message.trim().length < 5 ? "Please write a little more so we can help." : null],
    ]);
    setFields(local);
    if (hasErrors(local)) return false;

    setStatus(resending ? "verifying" : "sending");
    setError("");
    setNotice("");
    try {
      const { res, data } = await post(false);

      if (res.status === 202 && data.needsCode) {
        setToken(data.token);
        setCode("");
        setDevCode(data.devCode ?? null);
        setStatus("code");
        return true;
      }
      if (!res.ok) {
        if (res.status === 422 && data.fields) setFields(data.fields);
        setError(
          res.status === 422 && data.fields ? "" : data.error ?? "Something went wrong. Please try again."
        );
        setStatus(fallback);
        return false;
      }

      setDevFallback(data.devFallback ?? null);
      setStatus("sent");
      return false;
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
      setStatus(fallback);
      return false;
    }
  };

  /** Second step: the code from their inbox, sent along with the message. */
  const verify = async () => {
    if (!/^\d{6}$/.test(code.replace(/\s+/g, ""))) {
      setFields({ code: "Please enter the 6-digit code from the email." });
      return;
    }

    setStatus("verifying");
    setFields({});
    setError("");
    setNotice("");
    try {
      const { res, data } = await post(true);

      if (res.ok && !data.needsCode) {
        setDevFallback(data.devFallback ?? null);
        setStatus("sent");
        return;
      }
      if (res.status === 422 && data.fields?.code) {
        setFields({ code: data.fields.code });
      } else {
        // expired, locked, or anything else: a new code is the way forward
        setError(data.error ?? "Something went wrong. Please try again.");
      }
      setStatus("code");
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
      setStatus("code");
    }
  };

  /** A fresh code to the same address. */
  const resend = async () => {
    if (await submit(true)) setNotice("A new code is on its way. Only the newest one works.");
  };

  /** Back to the message, to fix the address. */
  const changeEmail = () => {
    setStatus("idle");
    setToken("");
    setCode("");
    setFields({});
    setError("");
    setNotice("");
    setDevCode(null);
  };

  /** Clears the message for a fresh one; name and email stay filled. */
  const reset = () => {
    setMessage("");
    changeEmail();
    setDevFallback(null);
  };

  return {
    name,
    setName,
    email,
    setEmail,
    message,
    setMessage,
    code,
    setCode,
    fields,
    error,
    notice,
    status,
    devFallback,
    devCode,
    submit,
    verify,
    resend,
    changeEmail,
    reset,
  };
}
