import { desc, and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import {
  users,
  organizations,
  plans,
  invitations,
  activityLogs,
  User,
  NewUser,
  Organization,
  NewOrganization,
  Plan,
  NewPlan,
  Invitation,
  NewInvitation,
  ActivityLog,
  NewActivityLog,
} from "./../schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

export async function createInvitation(
  data: NewInvitation
): Promise<Invitation> {
  const [invitation] = await db.insert(invitations).values(data).returning();
  return invitation;
}

// Read invitation by ID
export async function getInvitationById(
  id: string
): Promise<Invitation | null> {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);
  return invitation || null;
}

export const getAllInvitations = async (): Promise<Invitation[]> =>
  db.select().from(invitations);

// Read invitations for organization
export async function getInvitationsForOrganization(
  orgId: string
): Promise<Invitation[]> {
  return await db
    .select()
    .from(invitations)
    .where(eq(invitations.organizationId, orgId));
}

// Update invitation
export async function updateInvitation(
  id: string,
  data: Partial<NewInvitation>
): Promise<Invitation | null> {
  const [invitation] = await db
    .update(invitations)
    .set({ ...data, respondedAt: data.status ? new Date() : undefined })
    .where(eq(invitations.id, id))
    .returning();
  return invitation || null;
}

// Delete invitation
export async function deleteInvitation(id: string): Promise<void> {
  await db.delete(invitations).where(eq(invitations.id, id));
}
