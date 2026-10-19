"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // the phone may be shared: the service worker drops every cached page and
    // image so nothing from this account opens offline after sign-out
    navigator.serviceWorker?.controller?.postMessage({ type: "signed-out" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      className={
        className ??
        "link-draw text-sm font-medium text-ink/70 transition-colors hover:text-forest-900"
      }
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
