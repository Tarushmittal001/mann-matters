import type { Metadata } from "next";
import { Suspense } from "react";
import AuthIntro from "@/components/auth/AuthIntro";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "साइन इन",
  description: "अपने Emoraa अकाउंट में साइन इन कीजिए।",
  alternates: {
    canonical: "/hi/login",
    languages: { "en-IN": "/login", "hi-IN": "/hi/login" },
  },
};

export default function HindiLoginPage() {
  return (
    <Suspense fallback={<AuthIntro mode="login" locale="hi" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
