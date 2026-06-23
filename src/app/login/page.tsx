"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signIn, signUp } from "./actions";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Please wait…" : label}
    </button>
  );
}

const DEMO = [
  { role: "Customer", email: "customer@purestream.app" },
  { role: "Shopper", email: "shopper@purestream.app" },
  { role: "Vendor", email: "vendor@purestream.app" },
  { role: "Admin", email: "admin@purestream.app" },
];

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const action = mode === "in" ? signIn : signUp;
  const [state, formAction] = useActionState(action, null as { error?: string } | null);

  return (
    <main className="app-shell px-6 py-12 flex flex-col">
      <Link href="/"><Logo /></Link>

      <h1 className="mt-10 text-2xl font-bold text-ink-900">
        {mode === "in" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="text-ink-500 mt-1">
        {mode === "in" ? "Sign in to continue." : "Sign up to start ordering."}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {mode === "up" && (
          <div>
            <label className="label">Full name</label>
            <input name="name" className="input" placeholder="Jordan Rivers" required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" className="input" placeholder="••••••••" required minLength={6} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitBtn label={mode === "in" ? "Sign in" : "Create account"} />
      </form>

      <button
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-4 text-sm text-brand-700 font-medium"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>

      <div className="mt-10 card p-4">
        <p className="text-xs font-semibold text-ink-500 mb-2">DEMO ACCOUNTS (password: <code>purestream</code>)</p>
        <ul className="text-sm space-y-1">
          {DEMO.map((d) => (
            <li key={d.email} className="flex justify-between">
              <span className="text-ink-700">{d.role}</span>
              <code className="text-ink-500">{d.email}</code>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
