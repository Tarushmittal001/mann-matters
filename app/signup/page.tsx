import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a mann Matters account to book and manage your therapy sessions.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
