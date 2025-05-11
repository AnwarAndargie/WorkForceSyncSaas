import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/users";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUser();
    
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is super_admin or an org_admin of the requested organization
    const hasPermission = 
      currentUser.role === "super_admin" || 
      (currentUser.role === "org_admin" && currentUser.organizationId === params.id);
    
    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get all users from the organization
    const organizationUsers = await db.query.users.findMany({
      where: eq(users.organizationId, params.id),
    });
    
    // Convert users to CSV format
    // Headers
    let csv = "email,name,role\n";
    
    // Add each user as a row
    organizationUsers.forEach(user => {
      const name = user.name ? `"${user.name.replace(/"/g, '""')}"` : "";
      csv += `${user.email},${name},${user.role}\n`;
    });
    
    // Set appropriate headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="organization-users.csv"');
    
    return new NextResponse(csv, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("[ORGANIZATION_USERS_EXPORT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 