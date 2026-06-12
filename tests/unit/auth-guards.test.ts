import { describe, expect, it } from "vitest";
import {
  hasLoginCredentials,
  hasResetPayload,
  isTokenExpired,
  passwordsMatch,
} from "@/app/pages/auth/authGuards";

describe("auth guard helpers", () => {
  it("validates login credentials presence", () => {
    expect(hasLoginCredentials("alice", "secret")).toBe(true);
    expect(hasLoginCredentials("", "secret")).toBe(false);
    expect(hasLoginCredentials("alice", "")).toBe(false);
  });

  it("validates reset payload presence", () => {
    expect(hasResetPayload("token", "pw", "pw")).toBe(true);
    expect(hasResetPayload(null, "pw", "pw")).toBe(false);
    expect(hasResetPayload("token", null, "pw")).toBe(false);
  });

  it("validates matching passwords", () => {
    expect(passwordsMatch("abc123", "abc123")).toBe(true);
    expect(passwordsMatch("abc123", "abc124")).toBe(false);
  });

  it("detects expired reset token correctly", () => {
    const now = new Date("2026-06-08T00:00:00.000Z");
    expect(isTokenExpired(new Date("2026-06-07T23:59:59.000Z"), now)).toBe(true);
    expect(isTokenExpired(new Date("2026-06-08T00:00:01.000Z"), now)).toBe(false);
    expect(isTokenExpired(null, now)).toBe(false);
  });
});
