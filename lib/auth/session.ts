import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { clients, NewUser, tenants } from "@/lib/db/schema";
import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SessionUser } from "./types";

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: string };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1 day from now")
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as SessionData;
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set("session", encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}

export async function getSessionUserId(
  request: NextRequest
): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return token;
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (sessionCookie) {
      const sessionData = await verifyToken(sessionCookie.value);
      return sessionData.user.id || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting session user ID:", error);
    return null;
  }
}

export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) return null;

    const user = await db
      .select({
        id: users.id,
        role: users.role,
        name: users.name,
        email: users.email,
        tenantId: tenants.id,
        clientId: clients.id,
      })
      .from(users)
      .leftJoin(tenants, eq(users.id, tenants.adminId))
      .leftJoin(clients, eq(users.id, clients.adminId))
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) return null;

    const userData = user[0];

    if (!userData.role) return null;

    return {
      id: userData.id,
      role: userData.role as
        | "super_admin"
        | "tenant_admin"
        | "client_admin"
        | "employee",
      name: userData.name ?? undefined,
      email: userData.email ?? undefined,
      tenantId: userData.tenantId ?? undefined,
      clientId: userData.clientId ?? undefined,
    };
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<SessionUser | null> {
  const user = await getSessionUser(request);
  return user;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
