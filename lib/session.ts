import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "dvh_session";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn("[session] SESSION_SECRET not set, using insecure default!");
  }
  return new TextEncoder().encode(secret ?? "change-me-in-production-min-32-chars!!");
}

export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  console.log("[session] Creating token with secret prefix:", Buffer.from(secret).toString("utf8").slice(0, 8) + "...");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = getSecret();
  console.log("[session] Verifying token with secret prefix:", Buffer.from(secret).toString("utf8").slice(0, 8) + "...");
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch (e) {
    console.warn("[session] Token verification failed:", (e as Error).message);
    return false;
  }
}
