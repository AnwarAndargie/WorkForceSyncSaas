import {
  mysqlTable,
  serial,
  varchar,
  text,
  boolean,
  datetime,
  date,
  decimal,
  mysqlEnum,
  primaryKey,
  index,
  timestamp,
} from "drizzle-orm/mysql-core";
import { generateId } from "./utils";

export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id").references((): any => clients.id),
  adminId: varchar("adminId").references((): any => users.id),
  slug: varchar("name", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  logo: varchar("name", { length: 255 }),
  ownerId: serial("ownerId").references((): any => users.id),
  createdAt: datetime("created_at"),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  role: mysqlEnum("role", [
    "super_admin",
    "client_admin",
    "tenant_admin",
    "employee",
  ]),
  passwordHash: text("password_hash"),
  isActive: boolean("is_active").default(true),
  createdAt: datetime("created_at"),
});
export const TenantMembers = mysqlTable(
  "tenant_members",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // generated with generateId("member")
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id),
  },
  (table) => ({
    tenantUserIndex: index("org_user_idx").on(table.tenantId, table.userId),
    pk: primaryKey({ columns: [table.id] }),
  })
);

export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  adminId: varchar("id", { length: 128 }).references(() => users.id),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
});

export const branches = mysqlTable("branches", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  supervisorId: varchar("id", { length: 128 }).references(() => users.id),
  tenantId: varchar("id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  clientId: varchar("id", { length: 128 })
    .notNull()
    .references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employeeBranches = mysqlTable("employee_branches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id),
  branchId: varchar("branch_id").references(() => branches.id),
  roleAtBranch: varchar("role_at_branch", { length: 100 }),
  assignedAt: datetime("assigned_at"),
});

export const assignments = mysqlTable("assignments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id),
  clientId: varchar("customer_id").references(() => clients.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: mysqlEnum("status", ["active", "inactive", "completed"]),
});

export const shifts = mysqlTable("shifts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  assignmentId: varchar("assignment_id").references(() => assignments.id),
  branchId: varchar("branch_id").references(() => branches.id),
  employeeId: varchar("employee_id").references(() => users.id),
  startTime: datetime("start_time"),
  endTime: datetime("end_time"),
  shiftType: varchar("shift_type", { length: 100 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]),
});

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  assignmentId: varchar("assignment_id").references(() => assignments.id),
  reportText: text("report_text"),
  createdAt: datetime("created_at"),
});

export const contracts = mysqlTable("contracts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  clientId: varchar("customer_id").references(() => clients.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  terms: text("terms"),
  status: mysqlEnum("status", ["active", "expired", "terminated"]),
});

export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  contractId: varchar("contract_id").references(() => contracts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  paid: boolean("paid"),
  paidAt: datetime("paid_at"),
});

export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]),
  createdAt: datetime("created_at"),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active"),
});

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  isRead: boolean("is_read"),
  createdAt: datetime("created_at"),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantMembers = typeof tenants.$inferInsert;

export type Plan = typeof subscriptionPlans.$inferSelect;
export type NewPlan = typeof subscriptionPlans.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotifiation = typeof notifications.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
