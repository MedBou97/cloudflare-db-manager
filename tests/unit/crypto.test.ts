import { describe, expect, it } from "vitest";
import { decryptSecretPayload, encryptSecretPayload } from "@/app/pages/databases/crypto";

if (!globalThis.btoa) {
  globalThis.btoa = (input: string) => Buffer.from(input, "binary").toString("base64");
}

if (!globalThis.atob) {
  globalThis.atob = (input: string) => Buffer.from(input, "base64").toString("binary");
}

describe("crypto payload helpers", () => {
  it("encrypts and decrypts payload with same secret", async () => {
    const payload = JSON.stringify({ host: "localhost", user: "tester" });
    const secret = "super-secret-key";

    const encrypted = await encryptSecretPayload(payload, secret);
    const decrypted = await decryptSecretPayload(encrypted, secret);

    expect(encrypted).toContain(".");
    expect(decrypted).toBe(payload);
  });

  it("stores provided key version as prefix", async () => {
    const encrypted = await encryptSecretPayload("hello", "key-123", 7);
    expect(encrypted.startsWith("7.")).toBe(true);
  });

  it("produces payload with three dot-separated parts", async () => {
    const encrypted = await encryptSecretPayload("hello", "key-123", 1);
    const parts = encrypted.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("1");
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("uses random IV so two encryptions differ", async () => {
    const payload = "same-payload";
    const secret = "same-secret";
    const first = await encryptSecretPayload(payload, secret);
    const second = await encryptSecretPayload(payload, secret);
    expect(first).not.toBe(second);
  });

  it("throws on invalid encrypted payload format", async () => {
    await expect(decryptSecretPayload("invalid-format", "key-123")).rejects.toThrow(
      "Invalid encrypted payload format",
    );
  });

  it("fails decryption with wrong secret", async () => {
    const encrypted = await encryptSecretPayload("sensitive", "correct-secret");
    await expect(decryptSecretPayload(encrypted, "wrong-secret")).rejects.toThrow();
  });

  it("supports unicode payload round-trip", async () => {
    const payload = JSON.stringify({ message: "merhaba dunya", emoji: "test" });
    const secret = "unicode-secret";
    const encrypted = await encryptSecretPayload(payload, secret);
    await expect(decryptSecretPayload(encrypted, secret)).resolves.toBe(payload);
  });
});
