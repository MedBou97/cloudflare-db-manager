"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle?: string;
  asideBody?: string;
  footer?: ReactNode;
};

type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  required?: boolean;
};

type AuthStatusProps = {
  tone: "error" | "success";
  message: string;
};

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export const AuthShell = ({
  eyebrow,
  title,
  description,
  children,
  asideTitle = "Private workspace access",
  asideBody = "Use your account to manage records, verify identities, and keep the internal workspace consistent across sessions.",
  footer,
}: AuthShellProps) => {
  return (
    <main className="auth-page">
      <section className="auth-layout">
        <div className="auth-ambient auth-ambient-left" aria-hidden="true" />
        <div className="auth-ambient auth-ambient-right" aria-hidden="true" />

        <aside className="auth-aside">
          <p className="auth-kicker">DB Manager</p>
          <h1 className="auth-display">A cleaner way to handle sign in and account recovery.</h1>
          <p className="auth-lead">
            This workspace stays intentionally lean, so the auth flow should feel just as considered.
          </p>

          <div className="auth-aside-card">
            <p className="auth-aside-label">{asideTitle}</p>
            <p className="auth-aside-copy">{asideBody}</p>
          </div>
        </aside>

        <section className="auth-panel" aria-label={title}>
          <div className="auth-panel-header">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h2 className="auth-title">{title}</h2>
            <p className="auth-description">{description}</p>
          </div>

          {children}

          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>
      </section>
    </main>
  );
};

export const AuthField = ({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  hint,
  required = true,
}: AuthFieldProps) => {
  return (
    <label className="auth-field" htmlFor={name}>
      <span className="auth-label-row">
        <span className="auth-label">{label}</span>
        {hint ? <span className="auth-hint">{hint}</span> : null}
      </span>
      <input
        id={name}
        className="auth-input"
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </label>
  );
};

export const AuthStatus = ({ tone, message }: AuthStatusProps) => {
  return (
    <p className={`auth-status auth-status-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
};

export const AuthSubmitButton = ({ idleLabel, pendingLabel }: AuthSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <button className="auth-button" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
};
