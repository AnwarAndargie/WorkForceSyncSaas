import { db } from "./drizzle";
import { users } from "./schema";
import { generateId } from "./utils";

async function createTestUser() {
  try {
    const testUser = {
      id: "user_temp123",
      name: "Test Admin",
      email: "admin@test.com",
      role: "super_admin" as const,
      isActive: true,
      createdAt: new Date(),
    };

    await db.insert(users).values(testUser);
    console.log("Test user created successfully:", testUser);
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

if (require.main === module) {
  createTestUser().then(() => process.exit(0));
} 