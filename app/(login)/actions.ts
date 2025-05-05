"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import {
  users,
  invitations,
  organizations,
  NewActivityLog,
  ActivityType,
  userRole,
} from "@/lib/db/schema";
import { comparePasswords, hashPassword, setSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sendWelcomeEmail } from "@/lib/email/email-services";
import { createCheckoutSession } from "@/lib/payments/stripe";
import {
  getUser,
  createUser,
  createOrganization,
  createActivityLog,
  getUserByEmail,
  getOrganizationById,
  createInvitation,
} from "@/lib/db/queries";
import {
  validatedAction,
  validatedActionWithUser,
} from "@/lib/auth/middleware";
import { v4 as uuidv4 } from "uuid";

async function logActivity(
  teamId: string | null | undefined,
  userId: string,
  type: ActivityType,
  ipAddress?: string
) {
  if (!teamId) {
    return;
  }
  const newActivity: NewActivityLog = {
    userId,
    action: type,
    ipAddress: ipAddress || "",
  };
  await createActivityLog(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(7).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const user = await getUserByEmail(email);
  if (!user) {
    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  const isPasswordValid = await comparePasswords(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  const userWithOrganization = await getOrganizationById(user?.organizationId);
  const orgId = userWithOrganization?.id || null;

  await Promise.all([
    setSession(user),
    logActivity(orgId, user.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo === "checkout") {
    const priceId = formData.get("priceId") as string;
    const team = teamId
      ? await db.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
        })
      : null;
    if (!team) {
      return { error: "User is not part of a team." };
    }
    const org = await getOrganizationById(orgId!);
    return createCheckoutSession({ org, priceId });
  }

  redirect("/dashboard");
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(7),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: "Failed to create user. Email already exists.",
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  let userRole: (typeof users.role.enumValues)[number] = "member";
  let teamId: string | null = null;
  let createdTeam: { id: string } | null = null;
  let organizationId: string | null = null;
  let createdUser: { id: string } | null = null;

  // Derive name from email for welcome email
  const name = email.split("@")[0] || "User";

  if (inviteId) {
    // Check for a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, inviteId),
          eq(invitations.invitedUserEmail, email),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    if (invitation) {
      teamId = invitation.teamId;
      userRole = invitation.role;
      organizationId = invitation.organizationId;

      await db
        .update(invitations)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(invitations.id, invitation.id));
    } else {
      return { error: "Invalid or expired invitation.", email, password };
    }
  } else {
    // Generate a unique subdomain
    let baseSubdomain = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    let subdomain = baseSubdomain;
    let subdomainExists = true;
    let attempts = 0;
    const maxAttempts = 5;

    while (subdomainExists && attempts < maxAttempts) {
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.subdomain, subdomain))
        .limit(1);

      if (existingOrg.length === 0) {
        subdomainExists = false;
      } else {
        const suffix = uuidv4().slice(0, 8);
        subdomain = `${baseSubdomain}-${suffix}`;
        attempts++;
      }
    }

    if (subdomainExists) {
      return {
        error: "Unable to generate a unique subdomain.",
        email,
        password,
      };
    }

    // Create a new organization
    const newOrg = await createOrganization({
      id: uuidv4(),
      name: `${name}'s Organization`,
      subdomain,
    });
    if (!newOrg?.id) {
      return { error: "Failed to create organization.", email, password };
    }
    organizationId = newOrg.id;
    console.log(
      "Created organization:",
      organizationId,
      "with subdomain:",
      subdomain
    );

    // Create user first to get user ID
    const newUser = {
      id: uuidv4(),
      email,
      passwordHash,
      role: "org_admin",
      organizationId,
      name,
    };
    createdUser = await createUser(newUser);
    if (!createdUser) {
      return {
        error: "Failed to create user. Please try again.",
        email,
        password,
      };
    }
    console.log("Created user:", createdUser.id);
  }

  // For invitation path, create user after setting organizationId and teamId
  if (inviteId) {
    const newUser = {
      id: uuidv4(),
      email,
      passwordHash,
      role: userRole,
      organizationId,
      name,
    };
    createdUser = await createUser(newUser);
    if (!createdUser) {
      return {
        error: "Failed to create user. Please try again.",
        email,
        password,
      };
    }
    console.log("Created user:", createdUser.id);
  }

  if (!createdUser) {
    return { error: "User creation failed.", email, password };
  }

  const newTeamMember = {
    userId: createdUser.id,
    teamId,
  };

  // Send welcome email
  await sendWelcomeEmail({ id: createdUser.id, email, name });

  await Promise.all([
    // createTeamMember(newTeamMember),
    // logActivity(
    //   teamId,
    //   createdUser.id,
    //   inviteId ? ActivityType.ACCEPT_INVITATION : ActivityType.CREATE_TEAM
    // ),
    // logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser),
  ]);
  console.log("Created team member and logged activities");

  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo === "checkout") {
    const priceId = formData.get("priceId") as string;
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId!),
    });
    if (!org) {
      return { error: "Organization not found.", email, password };
    }
    return createCheckoutSession({ org, priceId });
  }

  redirect("/dashboard");
});

export async function signOut() {
  const user = await getUser();
  if (!user) {
    return;
  }
  (await cookies()).delete("session");
  redirect("/sign-in");
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(7).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );
    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "Current password is incorrect.",
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "New password must be different from the current password.",
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "New password and confirmation password do not match.",
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
    ]);

    return {
      success: "Password updated successfully.",
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: "Incorrect password. Account deletion failed.",
      };
    }

    // await Promise.all([
    //   logActivity(userWithTeam?.teamId, user.id, ActivityType.DELETE_ACCOUNT),
    //   db.delete(users).where(eq(users.id, user.id)),
    //   userWithTeam?.teamId
    //     ? db
    //         .delete(team_members)
    //         .where(
    //           and(
    //             eq(team_members.userId, user.id),
    //             eq(team_members.teamId, userWithTeam.teamId)
    //           )
    //         )
    //     : Promise.resolve(),
    // ]);

    (await cookies()).delete("session");
    redirect("/sign-in");
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;

    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use.", name, email };
    }

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      // logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { name, success: "Account updated successfully." };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.string().uuid(),
});

const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(userRole.enumValues),
});
