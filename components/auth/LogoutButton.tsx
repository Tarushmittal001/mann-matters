"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      className={
        className ??
        "link-draw text-sm font-medium text-ink/60 transition-colors hover:text-forest-900"
      }
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
