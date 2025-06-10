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
  index,
} from "drizzle-orm/mysql-core";

// Users table (central user store for super admin, tenant admins, tenant members, and client contacts)
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
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
  },
  (table) => ({
    emailIndex: index("email_idx").on(table.email),
  })
);

// Clients table (removed tenantId to break circular reference)
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 128 }).primaryKey(),
  adminId: varchar("admin_id", { length: 128 }).references(() => users.id, {
    onDelete: "set null",
  }),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
});

// Tenants table
export const tenants = mysqlTable(
  "tenants",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    adminId: varchar("admin_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    slug: varchar("slug", { length: 255 }),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    logo: varchar("logo", { length: 255 }),
    createdAt: datetime("created_at"),
  },
  (table) => ({
    emailIndex: index("email_idx").on(table.email),
  })
);

// TenantMembers table (associates users with tenants)
export const TenantMembers = mysqlTable(
  "tenant_members",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: varchar("tenant_id", { length: 128 })
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tenantUserIndex: index("org_user_idx").on(table.tenantId, table.userId),
  })
);

// Branches table
export const branches = mysqlTable("branches", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  supervisorId: varchar("supervisor_id", { length: 128 }).references(
    () => users.id,
    {
      onDelete: "set null",
    }
  ),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 128 })
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  createdAt: datetime("created_at"),
});

// EmployeeBranches table
export const employeeBranches = mysqlTable("employee_branches", {
  id: varchar("id", { length: 128 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 128 }).references(
    () => users.id,
    {
      onDelete: "cascade",
    }
  ),
  branchId: varchar("branch_id", { length: 128 }).references(
    () => branches.id,
    {
      onDelete: "cascade",
    }
  ),
  roleAtBranch: varchar("role_at_branch", { length: 100 }),
  assignedAt: datetime("assigned_at"),
});

// Assignments table
export const assignments = mysqlTable("assignments", {
  id: varchar("id", { length: 128 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 128 }).references(
    () => users.id,
    {
      onDelete: "cascade",
    }
  ),
  clientId: varchar("client_id", { length: 128 }).references(() => clients.id, {
    onDelete: "cascade",
  }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: mysqlEnum("status", ["active", "inactive", "completed"]),
});

// Shifts table
export const shifts = mysqlTable("shifts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 128 }).references(
    () => assignments.id,
    {
      onDelete: "cascade",
    }
  ),
  branchId: varchar("branch_id", { length: 128 }).references(
    () => branches.id,
    {
      onDelete: "cascade",
    }
  ),
  employeeId: varchar("employee_id", { length: 128 }).references(
    () => users.id,
    {
      onDelete: "cascade",
    }
  ),
  startTime: datetime("start_time"),
  endTime: datetime("end_time"),
  shiftType: varchar("shift_type", { length: 100 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]),
});

// Reports table
export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 128 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 128 }).references(
    () => assignments.id,
    {
      onDelete: "cascade",
    }
  ),
  reportText: text("report_text"),
  createdAt: datetime("created_at"),
});

// Contracts table
export const contracts = mysqlTable("contracts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 128 }).references(() => tenants.id, {
    onDelete: "cascade",
  }),
  clientId: varchar("client_id", { length: 128 }).references(() => clients.id, {
    onDelete: "cascade",
  }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  terms: text("terms"),
  status: mysqlEnum("status", ["active", "expired", "terminated"]),
});

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 128 }).primaryKey(),
  contractId: varchar("contract_id", { length: 128 }).references(
    () => contracts.id,
    {
      onDelete: "cascade",
    }
  ),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  paid: boolean("paid").default(false),
  paidAt: datetime("paid_at"),
});

// SubscriptionPlans table
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]),
  createdAt: datetime("created_at"),
});

// Subscriptions table
export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 128 }).references(() => tenants.id, {
    onDelete: "cascade",
  }),
  planId: varchar("plan_id", { length: 128 }).references(
    () => subscriptionPlans.id,
    {
      onDelete: "cascade",
    }
  ),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
});

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: datetime("created_at"),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantMembersSelect = typeof TenantMembers.$inferSelect;
export type NewTenantMembers = typeof TenantMembers.$inferInsert;

export type Plan = typeof subscriptionPlans.$inferSelect;
export type NewPlan = typeof subscriptionPlans.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
