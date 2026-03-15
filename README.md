# DB Manager

A role-based vector data management application built on **RedwoodSDK** and deployed to **Cloudflare Workers**. It provides full CRUD for vector embeddings, an audit log, and a complete auth flow — all styled with Tailwind CSS v4.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| Framework | RedwoodSDK (rwsdk) |
| Bundler | Vite 6 |
| Database | Cloudflare D1 (SQLite) via Prisma 6 |
| Session store | Cloudflare Durable Objects |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Language | TypeScript (strict) |

## Features

### Authentication
- **Register** — username + email + password, sends email verification link
- **Login** — password-based, session cookie
- **Email verification** — token with expiry; account locked until verified
- **Forgot / Reset password** — token-based reset flow with expiry
- **Logout** — session destroyed, `303` redirect, protected pages marked `Cache-Control: no-store` to prevent back-button re-access

### Roles
| Role | Capabilities |
|---|---|
| `USER` | View records & logs |
| `ADMIN` | Create, edit, delete records; full log access |

### Vector Records
- Fields: label, description, category, source, tags (JSON array), numeric value, confidence, vector (JSON float array), dimension, metadata (JSON object), status (`active` / `inactive` / `pending`), version
- Inline edit with optimistic state — no page reload
- Delete with confirmation dialog
- Collapsible detail view with full vector and metadata display
- Paginated list with search, category filter, status filter, sort field + order

### Audit Log
- Every create / edit / delete action is written to `AuditLog`
- Paginated log page with timestamp, action badge, details, and resource chip


## Styling

Tailwind CSS v4 is used throughout. The custom theme is defined in `src/app/styles.css`:

```css
@theme {
  --color-accent: #1f6a52;
  --color-accent-strong: #124735;
  --font-sans: "Inter", "Segoe UI", sans-serif;
  --font-serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
}
```

A small critical CSS block is inlined in `Document.tsx` to set the background gradient before the JS bundle loads (preventing flash of unstyled content).

## Security

- Passwords hashed with bcrypt
- Sessions stored in Durable Objects, invalidated on logout
- `Cache-Control: no-store` on all protected routes — prevents browser back-button bypass after logout
- Security headers: HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- CSRF-safe: all mutations go through server actions (POST), not GET requests

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Cloudflare account with Workers and D1 enabled

### Local Development

currently redwoodsdk isn working properly on windows to a windows path mishandling so the best fix is to switch to linux or use wsl and download vs code wsl extension, and move to the next steps
here is a video link for setting wsl and ubuntu distro from minute 13:00 ~ 18:00
- [Setup WSL](https://www.youtube.com/watch?v=Hn4Z3K8kSrM)

```shell
pnpm install
pnpm dev
```

Create a `.dev.vars` file in the project root with your local secrets:

```
SESSION_SECRET=your-local-secret
EMAIL_FROM=noreply@example.com
# ... other vars
```

### Database

Apply migrations locally:

```shell
pnpm wrangler d1 migrations apply DB --local
```

Seed the database:

```shell
pnpm tsx src/scripts/seed.ts
```

### Deployment

1. Create a D1 database:

```shell
npx wrangler d1 create db-manager
```

2. Update `wrangler.jsonc` with the returned database ID.

3. Apply migrations to production:

```shell
pnpm wrangler d1 migrations apply DB --remote
```

4. Deploy:

```shell
pnpm deploy
```

## Further Reading

- [RedwoodSDK Documentation](https://docs.rwsdk.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)
