import { desc, and, eq } from "drizzle-orm";
import { db } from "./drizzle";
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
} from "./schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

// ---------- AUTHENTICATION ----------
// Get authenticated user

// ---------- ORGANIZATIONS CRUD ----------
// Create organization

// Read plan by ID

// ---------- INVITATIONS CRUD ----------
// Create invitation

// ---------- ACTIVITY LOGS CRUD ----------
// Create activity log
