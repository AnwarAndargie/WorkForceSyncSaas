import { desc, and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { users, User, NewUser } from "./../schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";

export async function getUser(): Promise<User | null> {
  const sessionCookie = (await cookies()).get("session");
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== "string"
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionData.user.id))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}

// ---------- USERS CRUD ----------
// Create user
export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// Read user by ID
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

// Read user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user || null;
}
export const updateUser = (id: string, data: Partial<NewUser>) =>
  db.update(users).set(data).where(users.id.eq(id));
// Delete user
export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}
