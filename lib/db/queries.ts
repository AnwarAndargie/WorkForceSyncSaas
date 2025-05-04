import { desc, and, eq, isNull, inArray } from "drizzle-orm";
import { db } from "./drizzle";
import {
  users,
  organizations,
  teams,
  team_members,
  plans,
  invitations,
  activityLogs,
  User,
  NewUser,
  Organization,
  NewOrganization,
  Team,
  NewTeam,
  TeamMember,
  NewTeamMember,
  Plan,
  NewPlan,
  Invitation,
  NewInvitation,
  ActivityLog,
  NewActivityLog,
  TeamDataWithMembers,
} from "./schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

// ---------- AUTHENTICATION ----------
// Get authenticated user
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

// Update user
// export async function updateUser(id: string, data: Partial<NewUser>): Promise<User | null> {
//   const [user] = await db
//     .update(users)
//     .set({ ...data, updatedAt: new Date() })
//     .where(eq(users.id, id))
//     .returning();
//   return user || null;
// }

// Delete user
export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// ---------- ORGANIZATIONS CRUD ----------
// Create organization
export async function createOrganization(
  data: NewOrganization
): Promise<Organization> {
  const [org] = await db.insert(organizations).values(data).returning();
  return org;
}

// Read organization by ID
export async function getOrganizationById(
  id: string
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return org || null;
}

// Read organization by subdomain
export async function getOrganizationBySubdomain(
  subdomain: string
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.subdomain, subdomain))
    .limit(1);
  return org || null;
}

// Read organization by Stripe customer ID (updated from getTeamByStripeCustomerId)
export async function getOrganizationByStripeCustomerId(
  customerId: string
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);
  return org || null;
}

// Update organization
export async function updateOrganization(
  id: string,
  data: Partial<NewOrganization>
): Promise<Organization | null> {
  const [org] = await db
    .update(organizations)
    .set(data)
    .where(eq(organizations.id, id))
    .returning();
  return org || null;
}

// Update organization subscription (updated from updateTeamSubscription)
export async function updateOrganizationSubscription(
  orgId: string,
  subscriptionData: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeSubscriptionPriceId?: string | null;
    stripeSubscriptionStatus?: string;
    stripeSubscriptionCurrentPeriodEnd?: number | null;
  }
): Promise<Organization | null> {
  const [org] = await db
    .update(organizations)
    .set(subscriptionData)
    .where(eq(organizations.id, orgId))
    .returning();
  return org || null;
}

// Delete organization
export async function deleteOrganization(id: string): Promise<void> {
  await db.delete(organizations).where(eq(organizations.id, id));
}

// ---------- TEAMS CRUD ----------
// Create team
export async function createTeam(data: NewTeam): Promise<Team> {
  const [team] = await db.insert(teams).values(data).returning();
  return team;
}

// Read team by ID
export async function getTeamById(id: string): Promise<Team | null> {
  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return team || null;
}

// Read teams for organization
export async function getTeamsForOrganization(orgId: string): Promise<Team[]> {
  return await db.select().from(teams).where(eq(teams.organizationId, orgId));
}

// Read team for user (updated from getTeamForUser)
export async function getTeamForUser(): Promise<Team | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.team_members.findFirst({
    where: eq(team_members.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.team || null;
}

// Update team
export async function updateTeam(
  id: string,
  data: Partial<NewTeam>
): Promise<Team | null> {
  const [team] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, id))
    .returning();
  return team || null;
}

// Delete team
export async function deleteTeam(id: string): Promise<void> {
  await db.delete(teams).where(eq(teams.id, id));
}

// ---------- TEAM MEMBERS CRUD ----------
// Create team member
export async function createTeamMember(
  data: NewTeamMember
): Promise<TeamMember> {
  const [member] = await db.insert(team_members).values(data).returning();
  return member;
}

// Read team members for team
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  return await db
    .select()
    .from(team_members)
    .where(eq(team_members.teamId, teamId));
}

// Read team member by user and team
export async function getTeamMember(
  userId: string,
  teamId: string
): Promise<TeamMember | null> {
  const [member] = await db
    .select()
    .from(team_members)
    .where(
      and(eq(team_members.userId, userId), eq(team_members.teamId, teamId))
    )
    .limit(1);
  return member || null;
}

// Delete team member
export async function deleteTeamMember(
  userId: string,
  teamId: string
): Promise<void> {
  await db
    .delete(team_members)
    .where(
      and(eq(team_members.userId, userId), eq(team_members.teamId, teamId))
    );
}

// ---------- PLANS CRUD ----------
// Create plan
export async function createPlan(data: NewPlan): Promise<Plan> {
  const [plan] = await db.insert(plans).values(data).returning();
  return plan;
}

// Read plan by ID
export async function getPlanById(id: string): Promise<Plan | null> {
  const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return plan || null;
}

// Read plan by Stripe price ID
export async function getPlanByStripePriceId(
  priceId: string
): Promise<Plan | null> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceId, priceId))
    .limit(1);
  return plan || null;
}

// Update plan
export async function updatePlan(
  id: string,
  data: Partial<NewPlan>
): Promise<Plan | null> {
  const [plan] = await db
    .update(plans)
    .set(data)
    .where(eq(plans.id, id))
    .returning();
  return plan || null;
}

// Delete plan
export async function deletePlan(id: string): Promise<void> {
  await db.delete(plans).where(eq(plans.id, id));
}

// ---------- INVITATIONS CRUD ----------
// Create invitation
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

// ---------- ACTIVITY LOGS CRUD ----------
// Create activity log
export async function createActivityLog(
  data: NewActivityLog
): Promise<ActivityLog> {
  const [log] = await db.insert(activityLogs).values(data).returning();
  return log;
}

// Read activity logs for user (updated from getActivityLogs)
export async function getActivityLogsForUser(limit: number = 10): Promise<
  Array<{
    id: string;
    action: string;
    timestamp: Date;
    ipAddress: string | null;
    userName: string | null;
  }>
> {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// Read activity logs for team
export async function getActivityLogsForTeam(
  teamId: string,
  limit: number = 10
): Promise<ActivityLog[]> {
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.teamId, teamId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// Delete activity log
export async function deleteActivityLog(id: string): Promise<void> {
  await db.delete(activityLogs).where(eq(activityLogs.id, id));
}

// ---------- COMPOSITE QUERIES ----------
// Get user with team (updated from getUserWithTeam)
export async function getUserWithTeam(): Promise<{
  user: User;
  teamId: string | null;
} | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db
    .select({
      user: users,
      teamId: team_members.teamId,
    })
    .from(users)
    .leftJoin(team_members, eq(users.id, team_members.userId))
    .where(eq(users.id, user.id))
    .limit(1);

  return result[0] || null;
}

// Get team with members and lead
export async function getTeamWithMembersAndLead(
  teamId: string
): Promise<TeamDataWithMembers | null> {
  const result = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      teamMembers: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return result || null;
}

// Get organization with teams and leads
export async function getOrganizationWithTeamsAndLeads(
  orgId: string
): Promise<
  (Organization & { teams: Array<Team & { lead: User | null }> }) | null
> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) {
    return null;
  }

  const orgTeams = await db
    .select({
      team: teams,
      lead: users,
    })
    .from(teams)
    .leftJoin(users, eq(teams.leadId, users.id))
    .where(eq(teams.organizationId, orgId));

  return {
    ...org,
    teams: orgTeams.map(({ team, lead }) => ({ ...team, lead })),
  };
}
