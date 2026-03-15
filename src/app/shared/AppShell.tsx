import type { ReactNode } from "react";
import type { User } from "@prisma/client";
import { ROLES } from "./constants";

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
        ? "bg-[rgba(31,106,82,0.12)] text-accent-strong"
        : "text-[#5f5044] hover:bg-[rgba(31,106,82,0.08)] hover:text-accent-strong"
    }`;

  const signBtnClass =
    "text-[0.8rem] font-semibold text-[#8a7767] no-underline px-2.5 py-1 rounded border border-[rgba(92,73,56,0.16)] transition-colors hover:text-[#1f1811] hover:border-[rgba(92,73,56,0.3)]";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-[100] border-b border-[rgba(86,67,48,0.12)] bg-[rgba(244,239,231,0.88)] backdrop-blur-[16px]">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center gap-6">
          <a
            href="/"
            className="flex items-center gap-2 font-bold text-[1rem] tracking-tight text-[#1f1811] no-underline shrink-0"
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
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#1f1811]">
                  {user.username}
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-accent to-accent-strong text-[#f7f8f6] text-[0.65rem] font-bold tracking-[0.08em]">
                      ADMIN
                    </span>
                  )}
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

