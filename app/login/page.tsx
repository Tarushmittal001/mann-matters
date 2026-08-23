import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your mann Matters account to manage your therapy sessions.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
