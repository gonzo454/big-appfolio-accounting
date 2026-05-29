import { SignJWT, jwtVerify } from "jose";

export type UserRole = "employee" | "investor";

export interface SessionPayload {
  userId: string;
  name: string;
  role: UserRole;
  expiresAt: Date;
}

const secretKey =
  process.env.SESSION_SECRET || "big-default-dev-secret-change-in-production";
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({
    ...payload,
    expiresAt: payload.expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    return null;
  }
}
