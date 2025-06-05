import {
  mysqlTable,
  serial,
  varchar,
  text,
  boolean,
  datetime,
  date,
  decimal,
  int,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { generateId } from "./utils";

export const tenants = mysqlTable("tenants", {
  id: serial("id").primaryKey(),
  clientId: int("client_id").references((): any => clients.id),
  slug: varchar("name", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  createdAt: datetime("created_at"),
});

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  tenantId: int("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  role: mysqlEnum("role", ["admin", "manager", "employee"]),
  passwordHash: text("password_hash"),
  isActive: boolean("is_active"),
  createdAt: datetime("created_at"),
});

export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  tenantId: int("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  branchId: int("branch_id").references(() => branches.id),
});

export const branches = mysqlTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  address: text("address"),
  supervisorId: int("supervisor_id").references(() => users.id),
});

export const employeeBranches = mysqlTable("employee_branches", {
  id: serial("id").primaryKey(),
  employeeId: int("employee_id").references(() => users.id),
  branchId: int("branch_id").references(() => branches.id),
  roleAtBranch: varchar("role_at_branch", { length: 100 }),
  assignedAt: datetime("assigned_at"),
});

export const assignments = mysqlTable("assignments", {
  id: serial("id").primaryKey(),
  employeeId: int("employee_id").references(() => users.id),
  clientId: int("customer_id").references(() => clients.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: mysqlEnum("status", ["active", "inactive", "completed"]),
});

export const shifts = mysqlTable("shifts", {
  id: serial("id").primaryKey(),
  assignmentId: int("assignment_id").references(() => assignments.id),
  branchId: int("branch_id").references(() => branches.id),
  employeeId: int("employee_id").references(() => users.id),
  startTime: datetime("start_time"),
  endTime: datetime("end_time"),
  shiftType: varchar("shift_type", { length: 100 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]),
});

export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  assignmentId: int("assignment_id").references(() => assignments.id),
  reportText: text("report_text"),
  createdAt: datetime("created_at"),
});

export const contracts = mysqlTable("contracts", {
  id: serial("id").primaryKey(),
  tenantId: int("tenant_id").references(() => tenants.id),
  clientId: int("customer_id").references(() => clients.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  terms: text("terms"),
  status: mysqlEnum("status", ["active", "expired", "terminated"]),
});

export const invoices = mysqlTable("invoices", {
  id: serial("id").primaryKey(),
  contractId: int("contract_id").references(() => contracts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  paid: boolean("paid"),
  paidAt: datetime("paid_at"),
});

export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]),
  createdAt: datetime("created_at"),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: int("tenant_id").references(() => tenants.id),
  planId: int("plan_id").references(() => subscriptionPlans.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active"),
});

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  isRead: boolean("is_read"),
  createdAt: datetime("created_at"),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Organization = typeof tenants.$inferSelect;
export type NewOrganization = typeof tenants.$inferInsert;

export type Plan = typeof subscriptionPlans.$inferSelect;
export type NewPlan = typeof subscriptionPlans.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotifiation = typeof notifications.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
