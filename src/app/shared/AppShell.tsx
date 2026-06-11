import type { ReactNode } from "react";
import type { User } from "@prisma/client";
import { ROLES } from "./constants";
import { ThemeToggle } from "./ThemeToggle";

type AppShellProps = {
  children: ReactNode;
  user: User | null;
  currentPath?: string;
};

export const AppShell = ({ children, user, currentPath = "" }: AppShellProps) => {
  const isAdmin = user?.role === ROLES.ADMIN;

  const navLinkClass = (path: string) =>
    `px-3.5 py-1.5 rounded-full text-sm font-semibold no-underline transition-colors ${
      currentPath === path
        ? "bg-[var(--c-accent-bg-active)] text-accent-strong"
        : "text-[var(--c-text-secondary)] hover:bg-[var(--c-accent-bg)] hover:text-accent-strong"
    }`;

  const signBtnClass =
    "text-[0.8rem] font-semibold text-[var(--c-text-muted)] no-underline px-2.5 py-1 rounded border border-[var(--c-border-input)] transition-colors hover:text-[var(--c-text)] hover:border-[var(--c-border-input-hover)]";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-[100] border-b border-[var(--c-border)] bg-[var(--c-bg-header)] backdrop-blur-[16px]">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center gap-6">
          <a
            href="/"
            className="flex items-center gap-2 font-bold text-[1rem] tracking-tight text-[var(--c-text)] no-underline shrink-0"
          >
            <span className="text-xl text-accent">⬡</span>
            DB Manager
          </a>

          {user && (
            <nav className="flex gap-1 flex-1" aria-label="Main navigation">
              <a href="/databases" className={navLinkClass("/databases")}>Databases</a>
              <a href="/logs" className={navLinkClass("/logs")}>Logs</a>
            </nav>
          )}

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--c-text)]">
                  {user.username}
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-[0.65rem] font-bold tracking-[0.08em]">
                    {user.role}
                  </span>
                </span>
                <a href="/logout" className={signBtnClass}>Sign out</a>
              </>
            ) : (
              <a href="/login" className={signBtnClass}>Sign in</a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

