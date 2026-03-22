import { RequestInfo } from "rwsdk/worker";
import { AppShell } from "@/app/shared/AppShell";

const kickerClass = "m-0 text-[0.8rem] font-bold tracking-[0.18em] uppercase text-[var(--c-text-muted)]";
const siteCardClass =
  "relative z-[1] p-8 max-[640px]:p-6 border border-[var(--c-border)] rounded-[32px] max-[640px]:rounded-3xl bg-[var(--c-bg-card)] shadow-[0_30px_80px_var(--c-shadow)] backdrop-blur-[18px]";
const dlItemClass = "pt-4 border-t border-[var(--c-border)]";

export function Home({ ctx }: RequestInfo) {
  const isLoggedIn = Boolean(ctx.user);
  const isVerified = Boolean(ctx.user?.verified);

  if (isVerified && ctx.user) {
    return (
      <AppShell user={ctx.user} currentPath="/">
        <div className="mb-8">
          <h1 className="m-0 mb-2 font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.03em]">
            Welcome back, {ctx.user.username}.
          </h1>
          <p className="m-0 text-[var(--c-text-secondary)] text-[1.05rem] leading-[1.6]">
            Your workspace is ready. Browse vector records or review the operation log.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          <a
            href="/databases"
            className="block p-7 border border-[var(--c-border)] rounded-3xl bg-[var(--c-bg-card)] shadow-[0_8px_24px_var(--c-shadow-md)] no-underline text-inherit transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_var(--c-shadow-lg-hover)]"
          >
            <div className="text-[2rem] leading-none mb-3.5">🗄️</div>
            <h2 className="m-0 mb-2 text-[1.2rem] font-bold text-[var(--c-text)]">Databases</h2>
            <p className="m-0 text-sm text-[var(--c-text-secondary)] leading-[1.6]">
              Browse imported vector datasets, search and filter records, or import a new JSON
              dataset with structural validation.
            </p>
          </a>

          <a
            href="/logs"
            className="block p-7 border border-[var(--c-border)] rounded-3xl bg-[var(--c-bg-card)] shadow-[0_8px_24px_var(--c-shadow-md)] no-underline text-inherit transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_var(--c-shadow-lg-hover)]"
          >
            <div className="text-[2rem] leading-none mb-3.5">📋</div>
            <h2 className="m-0 mb-2 text-[1.2rem] font-bold text-[var(--c-text)]">Audit Logs</h2>
            <p className="m-0 text-sm text-[var(--c-text-secondary)] leading-[1.6]">
              View a complete history of all operations performed in this workspace — who did what
              and when.
            </p>
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen p-8 max-[900px]:p-[18px]">
      <section className="grid grid-cols-[minmax(320px,1.3fr)_minmax(320px,0.9fr)] max-[900px]:grid-cols-1 gap-8 items-center min-h-[calc(100vh-64px)] max-[900px]:min-h-0 max-w-[1180px] mx-auto">
        <div className="relative z-[1]">
          <p className={kickerClass}>DB Manager</p>
          <h1 className="mt-[14px] mb-0 max-w-[11ch] max-[900px]:max-w-none font-serif text-[clamp(3rem,6vw,5.2rem)] leading-[0.95] tracking-[-0.045em]">
            {isLoggedIn
              ? `Welcome back, ${ctx.user?.username}.`
              : "Keep account access and internal records under control."}
          </h1>
          <p className="mt-2 mb-0 max-w-[39rem] text-[var(--c-text-secondary)] text-[1.05rem] leading-[1.75]">
            {isLoggedIn
              ? "Your account is created but not yet verified. Check your inbox for the verification link."
              : "A role-based vector data management workspace with full audit logging."}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-[30px] max-[640px]:flex-col max-[640px]:items-stretch">
            {isLoggedIn ? (
              <a
                className="text-accent-strong font-bold no-underline [border-bottom:1px_solid_var(--c-accent-link-border)] hover:[border-bottom-color:var(--c-accent-link-border-hover)]"
                href="/logout"
              >
                Log out
              </a>
            ) : (
              <>
                <a
                  className="inline-flex items-center justify-center min-w-[180px] px-5 py-4 rounded-full bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] font-bold no-underline shadow-[0_18px_30px_var(--c-accent-shadow)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_22px_34px_var(--c-accent-shadow-hover)] max-[640px]:w-full max-[640px]:min-w-0"
                  href="/register"
                >
                  Create account
                </a>
                <a
                  className="text-accent-strong font-bold no-underline [border-bottom:1px_solid_var(--c-accent-link-border)] hover:[border-bottom-color:var(--c-accent-link-border-hover)]"
                  href="/login"
                >
                  Sign in
                </a>
              </>
            )}
          </div>
        </div>

        <section className={siteCardClass} aria-label="Current access status">
          <p className={kickerClass}>Status</p>
          <h2 className="mt-3.5 mb-0 font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05] tracking-[-0.03em]">
            {isLoggedIn ? "Account created, verification pending" : "No active session"}
          </h2>
          <p className="mt-3.5 mb-0 text-[var(--c-text-secondary)] leading-[1.7]">
            {isLoggedIn
              ? "Check your inbox for the verification link before you can access the workspace."
              : "Sign in or create an account to access the vector data workspace."}
          </p>
          <dl className="mt-[26px] grid gap-[18px]">
            <div className={dlItemClass}>
              <dt className={kickerClass}>User</dt>
              <dd className="mt-2 ml-0 text-[var(--c-text)] text-[1.02rem] break-words">
                {ctx.user?.username ?? "Guest"}
              </dd>
            </div>
            <div className={dlItemClass}>
              <dt className={kickerClass}>Verified</dt>
              <dd className="mt-2 ml-0 text-[var(--c-text)] text-[1.02rem] break-words">
                {isVerified ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}

export function ProtectedHome({ ctx }: RequestInfo) {
  return (
    <main className="min-h-screen p-8 max-[900px]:p-[18px]">
      <section className="grid grid-cols-[minmax(320px,1.3fr)_minmax(320px,0.9fr)] max-[900px]:grid-cols-1 gap-8 items-center min-h-[calc(100vh-64px)] max-[900px]:min-h-0 max-w-[1180px] mx-auto">
        <div className="relative z-[1]">
          <p className={kickerClass}>Protected workspace</p>
          <h1 className="mt-[18px] mb-0 max-w-[11ch] max-[900px]:max-w-none font-serif text-[clamp(3rem,6vw,5.2rem)] leading-[0.95] tracking-[-0.045em]">
            Your verified account is active.
          </h1>
          <p className="mt-5 mb-0 max-w-[39rem] text-[var(--c-text-secondary)] text-[1.05rem] leading-[1.75]">
            This route is now styled to match the auth flow and can act as the base for your real
            dashboard, database views, or internal tools.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-[30px] max-[640px]:flex-col max-[640px]:items-stretch">
            <a
              className="inline-flex items-center justify-center min-w-[180px] px-5 py-4 rounded-full bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] font-bold no-underline shadow-[0_18px_30px_var(--c-accent-shadow)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_22px_34px_var(--c-accent-shadow-hover)] max-[640px]:w-full max-[640px]:min-w-0"
              href="/"
            >
              Back home
            </a>
            <a
              className="text-accent-strong font-bold no-underline [border-bottom:1px_solid_var(--c-accent-link-border)] hover:[border-bottom-color:var(--c-accent-link-border-hover)]"
              href="/logout"
            >
              Log out
            </a>
          </div>
        </div>

        <section className={siteCardClass} aria-label="Verified account summary">
          <p className={kickerClass}>Session summary</p>
          <h2 className="mt-3.5 mb-0 font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05] tracking-[-0.03em]">
            Signed in as {ctx.user?.username}
          </h2>
          <dl className="mt-[26px] grid gap-[18px]">
            <div className={dlItemClass}>
              <dt className={kickerClass}>Email</dt>
              <dd className="mt-2 ml-0 text-[var(--c-text)] text-[1.02rem] break-words">
                {ctx.user?.email ?? "Unavailable"}
              </dd>
            </div>
            <div className={dlItemClass}>
              <dt className={kickerClass}>User ID</dt>
              <dd className="mt-2 ml-0 text-[var(--c-text)] text-[1.02rem] break-words">
                {ctx.user?.id ?? "Unavailable"}
              </dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}

