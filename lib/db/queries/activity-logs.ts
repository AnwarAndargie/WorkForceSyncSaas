import { desc, and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { users, activityLogs, ActivityLog, NewActivityLog } from "./../schema";
import { getUser } from "./users";

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

// Delete activity log
export async function deleteActivityLog(id: string): Promise<void> {
  await db.delete(activityLogs).where(eq(activityLogs.id, id));
}
