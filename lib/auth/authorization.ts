import { db } from "@/lib/db/drizzle";
import { 
  tenants, 
  clients, 
  branches, 
  assignments, 
  invoices, 
  contracts,
  subscriptions,
  users
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SessionUser } from "./session";

export type ResourceType = 
  | "tenant" 
  | "client" 
  | "branch" 
  | "assignment" 
  | "invoice" 
  | "contract" 
  | "subscription" 
  | "user";

/**
 * Check if user has access to a specific tenant
 */
export async function checkTenantAccess(
  user: SessionUser, 
  tenantId: string
): Promise<boolean> {
  // Super admin has access to everything
  if (user.role === "super_admin") return true;
  
  // Tenant admin can only access their own tenant
  if (user.role === "tenant_admin") {
    return user.tenantId === tenantId;
  }
  
  // Client admin can access tenant through their client
  if (user.role === "client_admin" && user.clientId) {
    const client = await db
      .select({ tenantId: clients.tenantId })
      .from(clients)
      .where(eq(clients.id, user.clientId))
      .limit(1);
    
    return client.length > 0 && client[0].tenantId === tenantId;
  }
  
  return false;
}

/**
 * Check if user has access to a specific client
 */
export async function checkClientAccess(
  user: SessionUser, 
  clientId: string
): Promise<boolean> {
  // Super admin has access to everything
  if (user.role === "super_admin") return true;
  
  // Client admin can only access their own client
  if (user.role === "client_admin") {
    return user.clientId === clientId;
  }
  
  // Tenant admin can access clients in their tenant
  if (user.role === "tenant_admin" && user.tenantId) {
    const client = await db
      .select({ tenantId: clients.tenantId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    
    return client.length > 0 && client[0].tenantId === user.tenantId;
  }
  
  return false;
}

/**
 * Check if user has access to a specific branch
 */
export async function checkBranchAccess(
  user: SessionUser, 
  branchId: string
): Promise<boolean> {
  // Super admin has access to everything
  if (user.role === "super_admin") return true;
  
  const branch = await db
    .select({ 
      tenantId: branches.tenantId, 
      clientId: branches.clientId 
    })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  
  if (branch.length === 0) return false;
  
  const branchData = branch[0];
  
  // Client admin can access branches in their client
  if (user.role === "client_admin") {
    return user.clientId === branchData.clientId;
  }
  
  // Tenant admin can access branches in their tenant
  if (user.role === "tenant_admin") {
    return user.tenantId === branchData.tenantId;
  }
  
  return false;
}

/**
 * Main authorization function - checks if user can access a resource
 */
export async function authorizeUserFor(
  resourceType: ResourceType,
  resourceId: string,
  user: SessionUser
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "tenant":
        return await checkTenantAccess(user, resourceId);
        
      case "client":
        return await checkClientAccess(user, resourceId);
        
      case "branch":
        return await checkBranchAccess(user, resourceId);
        
      case "assignment": {
        const assignment = await db
          .select({ employeeId: assignments.employeeId, clientId: assignments.clientId })
          .from(assignments)
          .where(eq(assignments.id, resourceId))
          .limit(1);
        
        if (assignment.length === 0 || !assignment[0].clientId) return false;
        
        // Check client access for the assignment
        return await checkClientAccess(user, assignment[0].clientId);
      }
      
      case "invoice": {
        const invoice = await db
          .select({ contractId: invoices.contractId })
          .from(invoices)
          .where(eq(invoices.id, resourceId))
          .limit(1);
        
        if (invoice.length === 0 || !invoice[0].contractId) return false;
        
        const contract = await db
          .select({ tenantId: contracts.tenantId, clientId: contracts.clientId })
          .from(contracts)
          .where(eq(contracts.id, invoice[0].contractId))
          .limit(1);
        
        if (contract.length === 0 || !contract[0].tenantId) return false;
        
        // Check tenant or client access
        if (user.role === "client_admin" && contract[0].clientId) {
          return user.clientId === contract[0].clientId;
        }
        return await checkTenantAccess(user, contract[0].tenantId);
      }
      
      case "contract": {
        const contract = await db
          .select({ tenantId: contracts.tenantId, clientId: contracts.clientId })
          .from(contracts)
          .where(eq(contracts.id, resourceId))
          .limit(1);
        
        if (contract.length === 0 || !contract[0].tenantId) return false;
        
        // Check tenant or client access
        if (user.role === "client_admin" && contract[0].clientId) {
          return user.clientId === contract[0].clientId;
        }
        return await checkTenantAccess(user, contract[0].tenantId);
      }
      
      case "subscription": {
        const subscription = await db
          .select({ tenantId: subscriptions.tenantId })
          .from(subscriptions)
          .where(eq(subscriptions.id, resourceId))
          .limit(1);
        
        if (subscription.length === 0 || !subscription[0].tenantId) return false;
        
        return await checkTenantAccess(user, subscription[0].tenantId);
      }
      
      case "user": {
        const targetUser = await db
          .select({ tenantId: users.tenantId })
          .from(users)
          .where(eq(users.id, resourceId))
          .limit(1);
        
        if (targetUser.length === 0 || !targetUser[0].tenantId) return false;
        
        return await checkTenantAccess(user, targetUser[0].tenantId);
      }
      
      default:
        return false;
    }
  } catch (error) {
    console.error("Authorization error:", error);
    return false;
  }
}

/**
 * Simple user access check for tenant and optional client
 * Used in endpoints that require tenantId and optional clientId
 */
export async function checkUserAccess(
  userId: string,
  tenantId: string,
  clientId?: string
): Promise<boolean> {
  try {
    const user = await db
      .select({
        id: users.id,
        role: users.role,
        tenantId: users.tenantId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) return false;

    const userData = user[0];
    const sessionUser: SessionUser = {
      id: userData.id,
      role: userData.role as SessionUser["role"],
      tenantId: userData.tenantId || undefined,
      clientId: clientId, // For client_admin, this would be set properly
    };

    // Check tenant access
    const hasAccess = await checkTenantAccess(sessionUser, tenantId);
    if (!hasAccess) return false;

    // If clientId is provided, check client access
    if (clientId) {
      return await checkClientAccess(sessionUser, clientId);
    }

    return true;
  } catch (error) {
    console.error("User access check error:", error);
    return false;
  }
}

/**
 * Check if user can perform write operations (create, update, delete)
 */
export function canPerformWriteOperation(user: SessionUser): boolean {
  // Only admins can perform write operations
  return ["super_admin", "tenant_admin", "client_admin"].includes(user.role);
}

/**
 * Filter tenant-scoped query conditions based on user role
 */
export function getTenantScopeCondition(user: SessionUser) {
  if (user.role === "super_admin") {
    return null; // No restrictions
  }
  
  if (user.role === "tenant_admin" && user.tenantId) {
    return { tenantId: user.tenantId };
  }
  
  if (user.role === "client_admin" && user.clientId) {
    return { clientId: user.clientId };
  }
  
  return null;
}
