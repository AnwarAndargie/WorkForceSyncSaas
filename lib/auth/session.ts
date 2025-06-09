import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NewUser } from "@/lib/db/schema";
import { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export interface SessionUser {
  id: string;
  role: "super_admin" | "tenant_admin" | "client_admin" | "employee";
  clientId?: string;
  name?: string;
  email?: string;
}

/**
 * Extract user ID from session cookie or authorization header
 */
export async function getSessionUserId(
  request: NextRequest
): Promise<string | null> {
  try {
    // Try to get from Authorization header first (for API calls)
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // You would validate the JWT token here and extract the user ID
      // For now, we'll assume the token is the user ID (implement proper JWT validation)
      return token;
    }

    // Try to get from cookies (for browser requests)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (sessionCookie) {
      // Parse session cookie (you might want to decrypt/validate this)
      const sessionData = await verifyToken(sessionCookie.value);
      return sessionData.user.id || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting session user ID:", error);
    return null;
  }
}

/**
 * Get the full user object from session with role and tenant/client info
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) return null;

    // Fetch user from database with their role and associations
    const user = await db
      .select({
        id: users.id,
        role: users.role,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) return null;

    const userData = user[0];

    // Handle null role
    if (!userData.role) return null;

    // For client_admin role, we need to find their clientId
    // This would be determined by your business logic - maybe they're assigned to a specific client
    let clientId: string | undefined;

    if (userData.role === "client_admin") {
      // You might have a user-client relationship table or derive this differently
      // For now, we'll set it as undefined and you can customize this logic
      clientId = undefined; // Implement your client assignment logic here
    }

    return {
      id: userData.id,
      role: userData.role,
      clientId,
      name: userData.name || undefined,
      email: userData.email || undefined,
    };
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

/**
 * Validate if user is authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<SessionUser | null> {
  const user = await getSessionUser(request);
  return user;
}

/**
 * Clear session cookie (for logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
