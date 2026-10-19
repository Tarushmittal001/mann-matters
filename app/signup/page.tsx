import type { Metadata } from "next";
import { Suspense } from "react";
import AuthIntro from "@/components/auth/AuthIntro";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign up",
  alternates: {
    canonical: "/signup",
    languages: { "en-IN": "/signup", "hi-IN": "/hi/signup" },
  },
  description: "Create a Emoraa account to book and manage your therapy sessions.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthIntro mode="signup" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
