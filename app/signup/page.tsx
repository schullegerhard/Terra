import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-col bg-white px-4 py-16 text-black">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="text-sm font-medium text-black/55 hover:text-black">
            ← Back
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Join Terra</h1>
          <p className="mt-2 text-sm text-black/55">
            Create your profile with Google or X. Use a referral link to reward your
            inviter.
          </p>
        </div>
        <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-black/5" />}>
          <AuthForm />
        </Suspense>
        <p className="text-center text-sm text-black/55">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-black underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
