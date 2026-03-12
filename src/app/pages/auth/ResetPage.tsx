"use client";

import { useState } from "react";
import { handleResetPassword } from "./actions";
import { RequestInfo } from "rwsdk/worker";
import {
  AuthField,
  AuthShell,
  AuthStatus,
  AuthSubmitButton,
} from "./AuthShell";

const ResetPage = ({ request }: RequestInfo) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    const result = await handleResetPassword(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Password updated. Redirecting you back to sign in.");
      window.setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    }
  };

  return (
    <AuthShell
      eyebrow="Reset access"
      title="Choose a new password"
      description="Use the recovery token from your email to replace the existing password with something new."
      asideTitle="Short-lived reset tokens"
      asideBody="The reset link is tied to a temporary token stored with an expiry time so stale recovery requests cannot linger."
      footer={
        <>
          <p>
            Need a fresh reset email? <a href="/forgot">Request another link</a>
          </p>
          <p>
            Back to your account? <a href="/login">Return to sign in</a>
          </p>
        </>
      }
    >
      <form className="auth-form" action={handleSubmit}>
        {error ? <AuthStatus tone="error" message={error} /> : null}
        {success ? <AuthStatus tone="success" message={success} /> : null}
        <AuthField
          label="New password"
          name="password"
          type="password"
          placeholder="Enter a new password"
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter the password"
          autoComplete="new-password"
        />
        <input type="hidden" name="token" value={token} />
        <AuthSubmitButton
          idleLabel="Update password"
          pendingLabel="Updating password..."
        />
      </form>
    </AuthShell>
  );
};

export { ResetPage };
