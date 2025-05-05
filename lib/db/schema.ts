import {
  pgTable,
  text,
  uuid,
  timestamp,
  bigint,
  integer,
  varchar,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRole = pgEnum("role", [
  "super_admin",
  "org_admin",
  "team_lead",
  "member",
]);
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
]);

// ---------- USERS ----------
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: varchar("name", { length: 100 }),
  passwordHash: text("password_hash"),
  organizationId: uuid("organization_id").references(
    (): any => organizations.id,
    { onDelete: "cascade" }
  ), // nullable OK
  role: userRole("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }), // nullable OK
  planId: uuid("plan_id").references(() => plans.id, {
    onDelete: "set null",
  }), // nullable OK
  createdAt: timestamp("created_at").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeProductId: text("stripe_product_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionPriceId: text("stripe_subscription_price_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status"),
  stripeSubscriptionCurrentPeriodEnd: bigint(
    "stripe_subscription_current_period_end",
    {
      mode: "number",
    }
  ),
});

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  price: integer("price").notNull().default(10),
  currency: text("currency").default("usd"),
  stripePriceId: text("stripe_price_id").unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(), // added defaultRandom()
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  invitedUserEmail: text("invited_user_email").notNull(),
  role: userRole("role").notNull(),
  status: invitationStatus("status").default("pending"),
  sentAt: timestamp("sent_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emailType: text("email_type").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  openedAt: timestamp("opened_at"),
  failed: boolean("failed").notNull().default(false),
  errorMessage: text("error_message"),
});

// USERS RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  invitationsSent: many(invitations),
  activityLogs: many(activityLogs),
}));

// ORGANIZATIONS RELATIONS
export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    users: many(users),
    plan: one(plans, {
      fields: [organizations.planId],
      references: [plans.id],
    }),
  })
);

// ACTIVITY LOGS RELATIONS
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// INVITATIONS RELATIONS
export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
}));

// PLANS RELATIONS
export const plansRelations = relations(plans, ({ many }) => ({
  organizations: many(organizations),
}));

// TYPE EXPORTS
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type EmailEvent = typeof emailEvents.$inferSelect;

export enum ActivityType {
  SIGN_UP = "SIGN_UP",
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  UPDATE_PASSWORD = "UPDATE_PASSWORD",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  CREATE_TEAM = "CREATE_TEAM",
  REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
  INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
  ACCEPT_INVITATION = "ACCEPT_INVITATION",
}
