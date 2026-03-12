import { RequestInfo } from "rwsdk/worker";

export function Home({ ctx }: RequestInfo) {
  const isLoggedIn = Boolean(ctx.user);
  const isVerified = Boolean(ctx.user?.verified);

  return (
    <main className="site-shell">
      <section className="site-hero">
        <div className="site-copy">
          <p className="site-kicker">DB Manager</p>
          <h1 className="site-title">
            {isLoggedIn
              ? `Welcome back, ${ctx.user?.username}.`
              : "Keep account access and internal records under control."}
          </h1>
          <p className="site-description">
            {isLoggedIn
              ? "Your authentication layer is active, your data lives behind the worker, and the protected area is ready for the next feature set."
              : "This starter now has a complete auth surface with registration, verification, recovery, and a cleaner interface to match the rest of the stack."}
          </p>

          <div className="site-actions">
            {isVerified ? (
              <>
                <a className="site-button" href="/protected">
                  Open protected area
                </a>
                <a className="site-link" href="/logout">
                  Log out
                </a>
              </>
            ) : (
              <>
                <a className="site-button" href="/register">
                  Create account
                </a>
                <a className="site-link" href="/login">
                  Sign in
                </a>
              </>
            )}
          </div>
        </div>

        <section className="site-card" aria-label="Current access status">
          <p className="site-card-label">Status</p>
          <h2 className="site-card-title">
            {isVerified
              ? "Verified session active"
              : isLoggedIn
                ? "Account created, verification pending"
                : "No active session"}
          </h2>
          <p className="site-card-copy">
            {isVerified
              ? "You can enter protected routes and start building the actual app surface on top of the auth foundation."
              : isLoggedIn
                ? "You are signed in, but protected routes still require a verified account. Check your inbox for the verification link."
                : "Start with registration or sign in to see how the worker-backed session flow behaves end to end."}
          </p>

          <dl className="site-metrics">
            <div>
              <dt>User</dt>
              <dd>{ctx.user?.username ?? "Guest"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{ctx.user?.email ?? "Not signed in"}</dd>
            </div>
            <div>
              <dt>Verified</dt>
              <dd>{isVerified ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}

export function ProtectedHome({ ctx }: RequestInfo) {
  return (
    <main className="site-shell">
      <section className="site-hero">
        <div className="site-copy">
          <p className="site-kicker">Protected workspace</p>
          <h1 className="site-title">Your verified account is active.</h1>
          <p className="site-description">
            This route is now styled to match the auth flow and can act as the base for your real
            dashboard, database views, or internal tools.
          </p>

          <div className="site-actions">
            <a className="site-button" href="/">
              Back home
            </a>
            <a className="site-link" href="/logout">
              Log out
            </a>
          </div>
        </div>

        <section className="site-card" aria-label="Verified account summary">
          <p className="site-card-label">Session summary</p>
          <h2 className="site-card-title">Signed in as {ctx.user?.username}</h2>
          <p className="site-card-copy">
            You have passed the verified-user gate in the worker middleware. From here you can add
            tables, admin views, or anything else the app should expose after login.
          </p>

          <dl className="site-metrics">
            <div>
              <dt>Email</dt>
              <dd>{ctx.user?.email ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{ctx.user?.id ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Verification</dt>
              <dd>Confirmed</dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}
