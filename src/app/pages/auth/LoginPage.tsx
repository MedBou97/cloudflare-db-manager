"use client";

import { useState } from "react";
import { handleLogin } from "./actions";
import { AuthField, AuthShell, AuthStatus, AuthSubmitButton } from "./AuthShell";

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await handleLogin(formData);
    if (result.error) {
      setError(result.error);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to continue"
      description="Access your workspace, review your records, and continue where you left off."
      asideTitle="Built for repeat access"
      asideBody="The login flow keeps account access simple while session storage stays handled by the worker and durable object layer behind the scenes."
      footer={
        <>
          <p>
            Need an account? <a href="/register">Create one</a>
          </p>
          <p>
            Forgot your password? <a href="/forgot">Reset it</a>
          </p>
        </>
      }
    >
      <form className="auth-form" action={handleSubmit}>
        {error ? <AuthStatus tone="error" message={error} /> : null}
        <AuthField
          label="Username"
          name="username"
          placeholder="Enter your username"
          autoComplete="username"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
      </form>
    </AuthShell>
  );
};

export { LoginPage };
