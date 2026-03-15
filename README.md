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

## Data Models

```prisma
model User {
  id                  String         @id @default(uuid())
  username            String         @unique
  email               String         @unique
  password            String
  role                String         @default("USER")
  verified            Boolean        @default(false)
  verificationToken   String?        @unique
  verificationExpires DateTime?
  resetToken          String?        @unique
  resetTokenExpires   DateTime?
  createdAt           DateTime       @default(now())
  vectorRecords       VectorRecord[]
  auditLogs           AuditLog[]
}

model VectorRecord {
  id           String   @id @default(uuid())
  label        String
  description  String
  category     String
  source       String
  tags         String   @default("[]")
  numericValue Float
  confidence   Float
  vector       String
  dimension    Int
  metadata     String   @default("{}")
  status       String   @default("active")
  version      Int      @default(1)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @default(now())
  createdBy    User     @relation(fields: [createdById], references: [id])
  createdById  String
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  username   String
  action     String
  resourceId String?
  details    String
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}
```

## Project Structure

```
src/
  client.tsx              # Client entry point (imports Tailwind CSS)
  worker.tsx              # Cloudflare Worker entry, route definitions
  db.ts                   # Prisma client setup
  app/
    Document.tsx          # HTML shell with critical inline CSS (FOUC prevention)
    headers.ts            # Security headers middleware (HSTS, CSP, etc.)
    styles.css            # Tailwind v4 entry (@import "tailwindcss", @theme)
    pages/
      Home.tsx            # Landing page (guest) + dashboard (authenticated)
      auth/
        AuthShell.tsx     # Two-column auth layout
        LoginPage.tsx
        RegisterPage.tsx
        ForgotPage.tsx
        ResetPage.tsx
        middleware.ts     # loadAuthContext, requireVerified, requireAdmin
        routes.ts         # /login /register /forgot /reset /verify /logout
        actions.ts        # Server actions: login, register, forgot, reset
      records/
        RecordsPage.tsx   # Paginated record list with filters
        RecordCard.tsx    # Single record with inline edit + delete
        RecordFilters.tsx # Search / filter bar + create form (admin only)
        RecordList.tsx    # Record list wrapper
        routes.ts
      logs/
        LogsPage.tsx      # Paginated audit log
        routes.ts
    shared/
      AppShell.tsx        # Sticky nav + main layout wrapper
      constants.ts        # ROLES enum
      links.ts
  session/
    durableObject.ts      # Session Durable Object
    store.ts              # Session load / save / remove helpers
  scripts/
    seed.ts               # Database seed script
```

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
