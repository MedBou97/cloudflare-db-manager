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
    <main className="min-h-screen p-8 max-[900px]:p-[18px]">
      <section className="relative grid grid-cols-[minmax(280px,1fr)_minmax(320px,520px)] max-[900px]:grid-cols-1 gap-8 items-stretch min-h-[calc(100vh-64px)] max-[900px]:min-h-0 max-w-[1180px] mx-auto">
        <div
          className="absolute top-[10%] -left-[3%] w-[220px] h-[220px] rounded-full blur-[12px] pointer-events-none z-0 bg-[rgba(205,157,110,0.18)]"
          aria-hidden="true"
        />
        <div
          className="absolute right-[8%] bottom-[14%] w-[180px] h-[180px] rounded-full blur-[12px] pointer-events-none z-0 bg-[rgba(31,106,82,0.14)]"
          aria-hidden="true"
        />

        <aside className="relative z-[1] flex flex-col justify-center py-8 pr-4 max-[900px]:py-[18px] max-[900px]:px-1">
          <p className="m-0 text-[0.8rem] font-bold tracking-[0.18em] uppercase text-[#8a7767]">
            DB Manager
          </p>
          <h1 className="mt-[18px] mb-0 max-w-[12ch] max-[900px]:max-w-none font-serif text-[clamp(3rem,6vw,5.6rem)] leading-[0.92] tracking-[-0.04em]">
            A cleaner way to handle sign in and account recovery.
          </h1>
          <p className="mt-[22px] mb-0 max-w-[36rem] text-[#5f5044] text-[1.05rem] leading-[1.7]">
            This workspace stays intentionally lean, so the auth flow should feel just as considered.
          </p>
          <div className="mt-9 max-w-[28rem] py-[22px] px-6 border border-[rgba(86,67,48,0.12)] rounded-3xl bg-[rgba(255,250,244,0.56)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)] backdrop-blur-[12px]">
            <p className="m-0 text-[0.8rem] font-bold tracking-[0.18em] uppercase text-[#8a7767]">
              {asideTitle}
            </p>
            <p className="mt-2.5 mb-0 text-[#5f5044] leading-[1.7]">{asideBody}</p>
          </div>
        </aside>

        <section
          className="relative z-[1] flex flex-col justify-center p-9 max-[640px]:p-6 border border-[rgba(86,67,48,0.12)] rounded-[32px] max-[640px]:rounded-3xl bg-[rgba(255,252,247,0.82)] shadow-[0_30px_80px_rgba(76,56,34,0.14)] backdrop-blur-[18px]"
          aria-label={title}
        >
          <div className="mb-7">
            <p className="m-0 text-[0.8rem] font-bold tracking-[0.18em] uppercase text-[#8a7767]">
              {eyebrow}
            </p>
            <h2 className="mt-3 mb-0 font-serif text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
              {title}
            </h2>
            <p className="mt-3.5 mb-0 max-w-[34ch] text-[#5f5044] leading-[1.7]">{description}</p>
          </div>

          {children}

          {footer ? (
            <div className="mt-7 pt-[22px] border-t border-[rgba(86,67,48,0.12)] text-[#5f5044] grid gap-2 [&_p]:m-0 [&_p]:leading-[1.6] [&_a]:text-accent-strong [&_a]:no-underline [&_a]:[border-bottom:1px_solid_rgba(18,71,53,0.24)] [&_a:hover]:[border-bottom-color:rgba(18,71,53,0.56)]">
              {footer}
            </div>
          ) : null}
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
    <label className="flex flex-col gap-2.5" htmlFor={name}>
      <span className="flex justify-between gap-4 items-baseline">
        <span className="font-semibold text-[#1f1811]">{label}</span>
        {hint ? <span className="text-[#8a7767] text-[0.86rem]">{hint}</span> : null}
      </span>
      <input
        id={name}
        className="w-full px-[18px] py-4 border border-[rgba(92,73,56,0.16)] rounded-[18px] bg-[rgba(255,255,255,0.72)] text-[#1f1811] outline-none transition-[border-color,box-shadow,transform] duration-150 placeholder:text-[#998674] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_4px_rgba(31,106,82,0.35)] focus:-translate-y-px"
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
  const toneClass =
    tone === "error"
      ? "bg-[rgba(159,54,38,0.1)] border-[rgba(159,54,38,0.2)] text-[#7c271b]"
      : "bg-[rgba(31,106,82,0.12)] border-[rgba(31,106,82,0.2)] text-[#15523f]";
  return (
    <p
      className={`m-0 mb-1 px-4 py-3.5 rounded-[18px] border leading-[1.55] ${toneClass}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
};

export const AuthSubmitButton = ({ idleLabel, pendingLabel }: AuthSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-2 px-5 py-4 border-0 rounded-full bg-gradient-to-br from-accent to-accent-strong text-[#f7f8f6] font-bold tracking-[0.01em] cursor-pointer shadow-[0_18px_30px_rgba(18,71,53,0.2)] transition-[transform,box-shadow,filter] duration-150 hover:-translate-y-px hover:shadow-[0_22px_34px_rgba(18,71,53,0.26)] active:translate-y-0 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-80"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
};

