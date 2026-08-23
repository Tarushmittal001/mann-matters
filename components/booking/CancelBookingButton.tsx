"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const onCancel = async () => {
    setBusy(true);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "PATCH" });
    if (res.ok) {
      router.refresh();
    } else {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="link-draw text-sm font-medium text-ink/55 transition-colors hover:text-red-700"
      >
        Cancel session
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 text-sm">
      <span className="text-ink/60">Sure?</span>
      <button
        onClick={onCancel}
        disabled={busy}
        className={cn("font-semibold text-red-700", busy && "opacity-50")}
      >
        {busy ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="font-medium text-ink/55 hover:text-forest-900"
      >
        Keep it
      </button>
    </span>
  );
}
