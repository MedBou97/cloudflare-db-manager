const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

function fromBase64(data: string): Uint8Array<ArrayBuffer> {
  const binary = atob(data);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptSecretPayload(payload: string, secret: string, keyVersion = 1): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(secret);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(payload));
  return `${keyVersion}.${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

export async function decryptSecretPayload(encryptedPayload: string, secret: string): Promise<string> {
  const parts = encryptedPayload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = fromBase64(parts[1]);
  const cipher = fromBase64(parts[2]);
  const key = await deriveAesKey(secret);
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return textDecoder.decode(plainBuffer);
}
