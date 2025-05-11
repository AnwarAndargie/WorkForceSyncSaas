import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, userRole } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/users";
import { hash } from "bcrypt";

type UserRole = "super_admin" | "org_admin" | "team_lead" | "member";

export async function POST(
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
    
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }
    
    // Check if it's a CSV file
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return new NextResponse("Invalid file format. Please upload a CSV file.", { status: 400 });
    }
    
    // Read and parse the CSV content
    const fileContent = await file.text();
    const rows = fileContent.split('\n').map(row => row.trim()).filter(Boolean);
    
    if (rows.length < 2) {
      return new NextResponse("CSV file must contain at least a header row and one data row", { status: 400 });
    }
    
    // Parse header row to get column indices
    const header = rows[0].split(',');
    const emailIndex = header.findIndex(col => col.trim().toLowerCase() === 'email');
    const nameIndex = header.findIndex(col => col.trim().toLowerCase() === 'name');
    const roleIndex = header.findIndex(col => col.trim().toLowerCase() === 'role');
    
    if (emailIndex === -1) {
      return new NextResponse("CSV file must contain an 'email' column", { status: 400 });
    }
    
    // Process data rows
    const userRows = rows.slice(1);
    const validUsers = [];
    const errors = [];
    
    for (let i = 0; i < userRows.length; i++) {
      const rowNum = i + 2; // +2 because we're 1-indexed and we skipped the header
      try {
        // Handle quoted fields and commas within quotes
        const row = parseCsvRow(userRows[i]);
        
        if (!row[emailIndex] || !row[emailIndex].trim()) {
          errors.push(`Row ${rowNum}: Email is required`);
          continue;
        }
        
        const email = row[emailIndex].trim();
        const name = nameIndex !== -1 && row[nameIndex] ? row[nameIndex].trim() : null;
        
        // Validate role if provided
        let role: UserRole = "member"; // Default role
        if (roleIndex !== -1 && row[roleIndex]) {
          const providedRole = row[roleIndex].trim().toLowerCase() as UserRole;
          if (providedRole === 'member' || providedRole === 'team_lead' || providedRole === 'org_admin') {
            role = providedRole;
          } else {
            errors.push(`Row ${rowNum}: Invalid role '${row[roleIndex]}'. Using default 'member' instead.`);
          }
        }
        
        validUsers.push({
          email,
          name,
          role,
          organizationId: params.id,
          isActive: true
        });
      } catch (error: any) {
        errors.push(`Row ${rowNum}: ${error.message || 'Invalid format'}`);
      }
    }
    
    if (validUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid users found in the CSV file",
        errors
      }, { status: 400 });
    }
    
    // Insert valid users into the database
    const newUsers = await db.insert(users).values(validUsers).returning();
    
    return NextResponse.json({
      success: true,
      users: newUsers,
      errors: errors.length > 0 ? errors : undefined,
      totalImported: newUsers.length,
      totalErrors: errors.length
    });
  } catch (error: any) {
    console.error("[ORGANIZATION_USERS_IMPORT]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

// Helper function to parse CSV row, handling quoted values
function parseCsvRow(row: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      // If we see a double quote inside quotes, treat it as an escaped quote
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
} 