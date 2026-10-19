import type { Metadata } from "next";
import { Suspense } from "react";
import AuthIntro from "@/components/auth/AuthIntro";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  alternates: { canonical: "/forgot-password" },
  description: "Get a link to set a new password for your Emoraa account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthIntro mode="forgot" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
