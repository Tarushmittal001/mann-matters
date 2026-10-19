"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pause, resume, delete.
 *
 * Delete only appears on a code nobody has used. Once a code has taken money
 * off somebody's session it is part of the money record, and the server
 * refuses to remove it however the button is pressed — this just stops
 * offering a door that is locked.
 */
export default function CouponActions({
  id,
  code,
  paused,
  used,
}: {
  id: string;
  code: string;
  paused: boolean;
  used: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (action: "pause" | "resume" | "delete") => {
    if (action === "delete" && !window.confirm(`Delete ${code}? It stops existing.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) router.refresh();
      else setError(data.error ?? "That didn't work.");
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => send(paused ? "resume" : "pause")}
          className="link-draw text-[0.82rem] font-medium text-forest-800 disabled:opacity-50"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        {!used && (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("delete")}
            className="link-draw text-[0.82rem] font-medium text-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="max-w-[16rem] text-right text-[0.78rem] text-red-700">{error}</p>}
    </div>
  );
}
