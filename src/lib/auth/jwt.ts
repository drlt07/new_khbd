// Edge-safe: dùng được trong middleware lẫn server.
import { SignJWT, jwtVerify } from "jose";
import { SESSION_MAX_AGE_SECONDS } from "./constants";

export type SessionPayload = { userId: string; name: string; email: string };

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET chưa được cấu hình hoặc quá ngắn (tối thiểu 32 ký tự).");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`).sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.userId === "string" ? (payload as unknown as SessionPayload) : null;
  } catch {
    return null;
  }
}
