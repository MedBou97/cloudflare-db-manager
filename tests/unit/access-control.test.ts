import { describe, expect, it } from "vitest";
import {
  canMutateDatabaseRows,
  isAdminUser,
  isVerifiedUser,
} from "@/app/shared/accessControl";

describe("access control role behavior", () => {
  it("marks verified users correctly", () => {
    expect(isVerifiedUser({ verified: true, role: "USER" })).toBe(true);
    expect(isVerifiedUser({ verified: false, role: "USER" })).toBe(false);
    expect(isVerifiedUser(undefined)).toBe(false);
  });

  it("distinguishes admin from normal user", () => {
    const admin = { verified: true, role: "ADMIN" };
    const user = { verified: true, role: "USER" };
    expect(isAdminUser(admin)).toBe(true);
    expect(isAdminUser(user)).toBe(false);
  });

  it("allows mutation only for verified admins", () => {
    expect(canMutateDatabaseRows({ verified: true, role: "ADMIN" })).toBe(true);
    expect(canMutateDatabaseRows({ verified: true, role: "USER" })).toBe(false);
    expect(canMutateDatabaseRows({ verified: false, role: "ADMIN" })).toBe(false);
  });
});
