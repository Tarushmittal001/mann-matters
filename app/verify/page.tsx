import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyClient from "@/components/auth/VerifyClient";

export const metadata: Metadata = {
  title: "Confirming your email",
  robots: { index: false },
};

export default function VerifyPage() {
  return (
    <section className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
      <Suspense fallback={<p className="text-ink/60">Loading…</p>}>
        <VerifyClient />
      </Suspense>
    </section>
  );
}
