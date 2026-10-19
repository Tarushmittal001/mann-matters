import type { Metadata } from "next";
import { Suspense } from "react";
import AuthIntro from "@/components/auth/AuthIntro";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign in",
  alternates: {
    canonical: "/login",
    languages: { "en-IN": "/login", "hi-IN": "/hi/login" },
  },
  description: "Sign in to your Emoraa account to manage your therapy sessions.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthIntro mode="login" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
