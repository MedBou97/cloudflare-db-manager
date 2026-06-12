import { env } from "cloudflare:workers";

export const MISSING_DB_CONNECTION_ENCRYPTION_KEY_ERROR =
  "Server is missing DB_CONNECTION_ENCRYPTION_KEY (or fallback AUTH_SECRET_KEY).";

export function getDatabaseConnectionEncryptionKey(): string | null {
  const candidate = env.DB_CONNECTION_ENCRYPTION_KEY ?? env.AUTH_SECRET_KEY;
  const normalized = candidate?.trim();
  return normalized ? normalized : null;
}