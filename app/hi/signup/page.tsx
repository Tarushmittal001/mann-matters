import type { Metadata } from "next";
import { Suspense } from "react";
import AuthIntro from "@/components/auth/AuthIntro";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "अकाउंट बनाइए",
  description: "सेशन बुक करने और संभालने के लिए Emoraa अकाउंट बनाइए।",
  alternates: {
    canonical: "/hi/signup",
    languages: { "en-IN": "/signup", "hi-IN": "/hi/signup" },
  },
};

export default function HindiSignupPage() {
  return (
    <Suspense fallback={<AuthIntro mode="signup" locale="hi" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
