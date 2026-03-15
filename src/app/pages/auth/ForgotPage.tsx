"use client";

import { useState } from "react";
import { handleForgotPassword } from "./actions";
import {
  AuthField,
  AuthShell,
  AuthStatus,
  AuthSubmitButton,
} from "./AuthShell";

const ForgotPage = () => {
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setMessage(null);
    const result = await handleForgotPassword(formData);
    if (result.error) {
      setMessage({ tone: "error", text: result.error });
    } else {
      setMessage({
        tone: "success",
        text: "Please check your email for a link to reset your password.",
      });
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Request a password reset"
      description="Enter the email address tied to your account and we will send a secure reset link."
      asideTitle="Recovery without friction"
      asideBody="The reset flow checks verification first, then issues a time-limited token so password changes stay deliberate and traceable."
      footer={
        <>
          <p>
            Remembered your password? <a href="/login"><span className="text-blue-400">Back to sign in</span></a>
          </p>
          <p>
            Need a new account instead? <a href="/register"><span className="text-blue-400">Create one here</span></a>
          </p>
        </>
      }
    >
      <form className="flex flex-col gap-4" action={handleSubmit}>
        {message ? <AuthStatus tone={message.tone} message={message.text} /> : null}
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
        />
        <AuthSubmitButton
          idleLabel="Send reset link"
          pendingLabel="Sending link..."
        />
      </form>
    </AuthShell>
  );
};

export { ForgotPage };
