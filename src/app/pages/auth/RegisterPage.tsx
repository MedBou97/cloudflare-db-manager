"use client";

import { useState } from "react";
import { handleRegister } from "./actions";
import {
  AuthField,
  AuthShell,
  AuthStatus,
  AuthSubmitButton,
} from "./AuthShell";

const RegisterPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    const result = await handleRegister(formData);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Account created. Check your inbox to verify your email.");
    window.setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  };

  return (
    <AuthShell
      eyebrow="New account"
      title="Create your workspace access"
      description="Set up your account once, then verify your email to unlock the rest of the flow."
      asideTitle="Verification built in"
      asideBody="Registration creates the account immediately and sends a verification link so you can validate ownership before using protected routes."
      footer={
        <>
          <p>
            Already have an account? <a href="/login"><span className="text-blue-400">Sign in</span></a>
          </p>
          <p>
            Need to start over later? You can request a new email from <a href="/forgot"><span className="text-blue-400">account recovery</span></a>.
          </p>
        </>
      }
    >
      <form className="flex flex-col gap-4" action={handleSubmit}>
        {error ? <AuthStatus tone="error" message={error} /> : null}
        {success ? <AuthStatus tone="success" message={success} /> : null}
        <AuthField
          label="Username"
          name="username"
          placeholder="Choose a username"
          autoComplete="username"
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          hint="Use at least one memorable phrase"
        />
        <AuthSubmitButton
          idleLabel="Create account"
          pendingLabel="Creating account..."
        />
      </form>
    </AuthShell>
  );
};

export { RegisterPage };