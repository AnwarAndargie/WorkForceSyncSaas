import { db } from "@/lib/db/drizzle";
import { users, tenants, clients } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function checkUserAccess(
  userId: string,
  tenantId: string,
  clientId?: string
) {
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) return false;

  const role = user[0].role;

  if (role === "super_admin") return true;

  if (role === "tenant_admin") {
    const ownsTenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), eq(tenants.adminId, userId)))
      .limit(1);
    return ownsTenant.length > 0;
  }

  if (role === "client_admin" && clientId) {
    const ownsClient = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.adminId, userId)))
      .limit(1);
    return ownsClient.length > 0;
  }

  return false;
}
