export type UserLike = {
  verified?: boolean | null;
  role?: string | null;
};

const ADMIN_ROLE = "ADMIN";

export function isVerifiedUser(user: UserLike | null | undefined): boolean {
  return Boolean(user?.verified);
}

export function isAdminUser(user: UserLike | null | undefined): boolean {
  return Boolean(user?.verified) && user?.role === ADMIN_ROLE;
}

export function canMutateDatabaseRows(user: UserLike | null | undefined): boolean {
  return isAdminUser(user);
}
