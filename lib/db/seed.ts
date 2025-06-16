import "dotenv/config";
import { db } from "./drizzle";
import {
  users,
  tenants,
  TenantMembers,
  subscriptionPlans,
  subscriptions,
  clients,
  contracts,
  branches,
} from "./schema";
import { generateId, hashPassword } from "./utils";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (optional, for clean seeding)
    console.log("🧹 Clearing existing data...");
    await db.delete(branches);
    await db.delete(contracts);
    await db.delete(subscriptions);
    await db.delete(clients);
    await db.delete(TenantMembers);
    await db.delete(tenants);
    await db.delete(subscriptionPlans);
    await db.delete(users);

    // Create sample subscription plans
    const samplePlans = [
      {
        id: generateId("plan"),
        name: "Free",
        description: "Basic features for getting started",
        price: "0.00",
        billingCycle: "monthly" as "monthly" | "yearly",
        createdAt: new Date(),
        isActive: true,
      },
      {
        id: generateId("plan"),
        name: "Normal",
        description: "Normal features for small businesses",
        price: "1000.00",
        billingCycle: "monthly" as "monthly" | "yearly",
        createdAt: new Date(),
        isActive: true,
      },
      {
        id: generateId("plan"),
        name: "Pro",
        description: "Advanced features for growing companies",
        price: "13456.00",
        billingCycle: "monthly" as "monthly" | "yearly",
        createdAt: new Date(),
        isActive: true,
      },
    ];

    console.log("📋 Creating subscription plans...");
    await db.insert(subscriptionPlans).values(samplePlans);

    // Create sample users
    const sampleUsers = [
      {
        id: generateId("user"),
        email: "superadmin@example.com",
        passwordHash: await hashPassword("password123"),
        name: "Super Admin",
        role: "employee" as
          | "super_admin"
          | "client_admin"
          | "tenant_admin"
          | "employee",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: generateId("user"),
        email: "tenantadmin1@example.com",
        passwordHash: await hashPassword("password123"),
        name: "Tenant Admin 1",
        role: "employee" as
          | "super_admin"
          | "client_admin"
          | "tenant_admin"
          | "employee",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: generateId("user"),
        email: "tenantadmin2@example.com",
        passwordHash: await hashPassword("password123"),
        name: "Tenant Admin 2",
        role: "employee" as
          | "super_admin"
          | "client_admin"
          | "tenant_admin"
          | "employee",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: generateId("user"),
        email: "clientadmin1@example.com",
        passwordHash: await hashPassword("password123"),
        name: "Client Admin 1",
        role: "employee" as
          | "super_admin"
          | "client_admin"
          | "tenant_admin"
          | "employee",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: generateId("user"),
        email: "employee1@example.com",
        passwordHash: await hashPassword("password123"),
        name: "Employee 1",
        role: "employee" as
          | "super_admin"
          | "client_admin"
          | "tenant_admin"
          | "employee",
        isActive: true,
        createdAt: new Date(),
      },
    ];

    console.log("👥 Creating users...");
    await db.insert(users).values(sampleUsers);

    // Create sample tenants
    const sampleTenants = [
      {
        id: generateId("tenant"),
        adminId: sampleUsers[1].id, // Tenant Admin 1
        slug: "acme-corp",
        name: "Acme Corporation",
        email: "contact@acme.com",
        phone: "+1234567890",
        address: "123 Business St, City",
        logo: "acme-logo.png",
        createdAt: new Date(),
      },
      {
        id: generateId("tenant"),
        adminId: sampleUsers[2].id, // Tenant Admin 2
        slug: "tech-startup",
        name: "Tech Startup Inc",
        email: "info@techstartup.com",
        phone: "+1987654321",
        address: "456 Innovation Ave, City",
        logo: "tech-logo.png",
        createdAt: new Date(),
      },
    ];

    console.log("🏢 Creating tenants...");
    await db.insert(tenants).values(sampleTenants);

    // Create tenant memberships
    const memberships = [
      {
        id: generateId("member"),
        userId: sampleUsers[1].id, // Tenant Admin 1
        tenantId: sampleTenants[0].id, // Acme
        salary: 100000,
      },
      {
        id: generateId("member"),
        userId: sampleUsers[2].id, // Tenant Admin 2
        tenantId: sampleTenants[1].id, // Tech Startup
        salary: 120000,
      },
      {
        id: generateId("member"),
        userId: sampleUsers[4].id, // Employee 1
        tenantId: sampleTenants[0].id, // Acme
        salary: 60000,
      },
    ];

    console.log("🤝 Creating tenant memberships...");
    await db.insert(TenantMembers).values(memberships);

    // Create sample clients
    const sampleClients = [
      {
        id: generateId("client"),
        adminId: sampleUsers[3].id, // Client Admin 1
        tenantId: sampleTenants[0].id, // Acme
        name: "Client Corp",
        phone: "+1112223333",
        address: "789 Client Rd, City",
      },
      {
        id: generateId("client"),
        adminId: null,
        tenantId: sampleTenants[1].id, // Tech Startup
        name: "Startup Client",
        phone: "+4445556666",
        address: "321 Startup Blvd, City",
      },
    ];

    console.log("👤 Creating clients...");
    await db.insert(clients).values(sampleClients);

    // Create sample subscriptions
    const sampleSubscriptions = [
      {
        id: generateId("sub"),
        tenantId: sampleTenants[0].id, // Acme
        planId: samplePlans[2].id, // Pro
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
      },
      {
        id: generateId("sub"),
        tenantId: sampleTenants[1].id, // Tech Startup
        planId: samplePlans[0].id, // Free
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
      },
    ];

    console.log("📅 Creating subscriptions...");
    await db.insert(subscriptions).values(sampleSubscriptions);

    // Create sample contracts
    const sampleContracts = [
      {
        id: generateId("contract"),
        tenantId: sampleTenants[0].id, // Acme
        clientId: sampleClients[0].id, // Client Corp
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        terms: "Standard service agreement",
        status: "active" as "terminated" | "active" | "expired",
      },
      {
        id: generateId("contract"),
        tenantId: sampleTenants[1].id, // Tech Startup
        clientId: sampleClients[1].id, // Startup Client
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        terms: "Basic service contract",
        status: "active" as "terminated" | "active" | "expired",
      },
    ];

    console.log("📝 Creating contracts...");
    await db.insert(contracts).values(sampleContracts);

    // Create sample branches
    const sampleBranches = [
      {
        id: generateId("branch"),
        name: "Acme Main Branch",
        address: "123 Branch St, City",
        supervisorId: sampleUsers[4].id, // Employee 1
        tenantId: sampleTenants[0].id, // Acme
        clientId: sampleClients[0].id, // Client Corp
        createdAt: new Date(),
      },
      {
        id: generateId("branch"),
        name: "Tech Startup Branch",
        address: "456 Branch Ave, City",
        supervisorId: null,
        tenantId: sampleTenants[1].id, // Tech Startup
        clientId: sampleClients[1].id, // Startup Client
        createdAt: new Date(),
      },
    ];

    console.log("🏬 Creating branches...");
    await db.insert(branches).values(sampleBranches);

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Sample data created:");
    console.log(`- ${samplePlans.length} subscription plans`);
    console.log(`- ${sampleUsers.length} users`);
    console.log(`- ${sampleTenants.length} tenants`);
    console.log(`- ${memberships.length} tenant memberships`);
    console.log(`- ${sampleClients.length} clients`);
    console.log(`- ${sampleSubscriptions.length} subscriptions`);
    console.log(`- ${sampleContracts.length} contracts`);
    console.log(`- ${sampleBranches.length} branches`);
    console.log("\n🔐 Sample login credentials:");
    console.log("Super Admin: superadmin@example.com | password123");
    console.log("Tenant Admin 1: tenantadmin1@example.com | password123");
    console.log("Tenant Admin 2: tenantadmin2@example.com | password123");
    console.log("Client Admin 1: clientadmin1@example.com | password123");
    console.log("Employee 1: employee1@example.com | password123");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
