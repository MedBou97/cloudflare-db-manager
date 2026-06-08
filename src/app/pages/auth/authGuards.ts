export function hasLoginCredentials(username: unknown, password: unknown): boolean {
  return Boolean(username && password);
}

export function hasResetPayload(token: unknown, password: unknown, confirmPassword: unknown): boolean {
  return Boolean(token && password && confirmPassword);
}

export function passwordsMatch(password: unknown, confirmPassword: unknown): boolean {
  return String(password ?? "") === String(confirmPassword ?? "");
}

export function isTokenExpired(expiresAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  return expiresAt < now;
}
