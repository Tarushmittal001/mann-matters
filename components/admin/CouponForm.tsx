"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Select } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import Button from "@/components/ui/Button";

/**
 * Making a code.
 *
 * Deliberately five fields and no wizard. The validation that matters runs on
 * the server — a 200%-off code has to be impossible, not merely discouraged —
 * and whatever it says comes back into the field it belongs to.
 */
export default function CouponForm() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [kind, setKind] = useState("FIXED");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [made, setMade] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setFields({});
    setError(null);
    setMade(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, kind, value, note, maxUses, expiresAt: expiresAt || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setMade(data.coupon.code);
        setCode("");
        setValue("");
        setNote("");
        setMaxUses("");
        setExpiresAt("");
        router.refresh();
      } else if (res.status === 422 && data.fields) {
        setFields(data.fields);
      } else {
        setError(data.error ?? "We couldn't make that code.");
      }
    } catch {
      setError("We couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-forest-800/10 bg-ivory-light p-7">
      <h2 className="font-display text-xl font-medium text-forest-900">New code</h2>
      <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink/70">
        It works the moment you make it. Nothing announces it — that part is yours.
      </p>

      {made && (
        <Alert tone="success" className="mt-5" title="Made.">
          <span className="font-mono font-semibold">{made}</span> is live and can be used now.
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      <div className="mt-6 space-y-4">
        <Field
          label="Code"
          required
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          placeholder="CAMPUS25"
          autoComplete="off"
          error={fields.code}
          hint="What people will type. Letters, numbers and dashes."
        />

        <Select
          label="Takes off"
          required
          value={kind}
          onChange={setKind}
          options={[
            { value: "FIXED", label: "A fixed amount in rupees" },
            { value: "PERCENT", label: "A percentage of the fee" },
          ]}
        />

        <Field
          label={kind === "PERCENT" ? "Per cent off" : "Rupees off"}
          required
          value={value}
          onChange={(v) => setValue(v.replace(/\D/g, "").slice(0, 5))}
          placeholder={kind === "PERCENT" ? "20" : "300"}
          inputMode="numeric"
          error={fields.value}
        />

        <Field
          label="How many times"
          value={maxUses}
          onChange={(v) => setMaxUses(v.replace(/\D/g, "").slice(0, 6))}
          placeholder="Unlimited"
          inputMode="numeric"
          error={fields.maxUses}
          hint="Leave empty for no limit. One person can only use a code once either way."
        />

        <div>
          <label
            htmlFor="coupon-expires"
            className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink/70"
          >
            Last day
            <span className="ml-1.5 normal-case tracking-normal text-ink/35">optional</span>
          </label>
          <input
            id="coupon-expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            aria-invalid={fields.expiresAt ? true : undefined}
            className="w-full rounded-xl border border-forest-800/15 bg-ivory-light px-4 py-3 text-[0.95rem] text-forest-900 focus:border-forest-800 focus:outline-none"
          />
          {fields.expiresAt && (
            <p className="mt-1.5 text-[0.82rem] text-red-700">{fields.expiresAt}</p>
          )}
        </div>

        <Field
          label="Note to yourself"
          value={note}
          onChange={setNote}
          placeholder="Delhi campus drive, Sept"
          maxLength={200}
          hint="Nobody but an admin ever sees this."
        />
      </div>

      <Button onClick={submit} variant="forest" className="mt-6 w-full" disabled={busy}>
        {busy ? <Spinner label="Making it…" /> : "Make the code"}
      </Button>
    </section>
  );
}
