# Authentication & Authorization System

This document outlines the comprehensive authentication and authorization system implemented across all API endpoints in the multi-tenant SaaS platform.

## 🔐 Authentication

### Session Management

The authentication system uses session-based authentication with the following components:

#### `getSessionUser(request: NextRequest): Promise<SessionUser | null>`
- Extracts the current user from session cookies or Authorization header
- Returns full user object with role and tenant/client associations
- Supports both cookie-based (browser) and token-based (API) authentication

#### `getSessionUserId(request: NextRequest): Promise<string | null>`
- Lightweight function to extract just the user ID from session
- Used when only user ID is needed for authorization checks

#### Session User Interface
```typescript
interface SessionUser {
  id: string;
  role: "super_admin" | "tenant_admin" | "client_admin" | "employee";
  tenantId?: string;
  clientId?: string;
  name?: string;
  email?: string;
}
```

## 🛡️ Authorization

### Role-Based Access Control

The system implements a hierarchical permission model:

#### **super_admin**
- Full access to all tenants, clients, and resources
- Can manage subscription plans (global resources)
- No restrictions on any operations

#### **tenant_admin** 
- Can manage all resources within their assigned `tenantId`
- Includes: clients, branches, users, assignments, invoices, contracts
- Cannot access resources from other tenants

#### **client_admin**
- Can manage resources under their assigned `clientId`
- Includes: branches, users, assignments for their client
- Cannot access resources from other clients

#### **employee**
- Read-only access to resources they're assigned to
- Cannot perform write operations (create, update, delete)

### Authorization Functions

#### Core Authorization
```typescript
authorizeUserFor(
  resourceType: ResourceType,
  resourceId: string, 
  user: SessionUser
): Promise<boolean>
```

Checks if a user can access a specific resource by:
1. Checking if user is super_admin (always allowed)
2. Traversing the data hierarchy to verify ownership
3. Returning boolean permission result

#### Access Helpers
- `checkTenantAccess(user, tenantId)` - Verify tenant access
- `checkClientAccess(user, clientId)` - Verify client access  
- `checkBranchAccess(user, branchId)` - Verify branch access
- `canPerformWriteOperation(user)` - Check if user can create/update/delete

#### Simple Access Check
```typescript
checkUserAccess(
  userId: string,
  tenantId: string, 
  clientId?: string
): Promise<boolean>
```

Used in endpoints that require tenantId and optional clientId parameters.

## 📊 Data Hierarchy & Relationships

```
Tenant (SaaS Customer)
├── Clients (e.g., Banks, Malls)  
│   ├── Branches (Physical Locations)
│   ├── Assignments (Employee-Client assignments)
│   └── Contracts
├── Users (Employees)
├── Subscriptions  
└── Invoices (via Contracts)
```

## 🔗 Implementation in API Endpoints

### Standard Authentication Pattern

Every protected endpoint follows this pattern:

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // 2. Authorization for specific resources
    const authorized = await authorizeUserFor("client", clientId, user);
    if (!authorized) {
      return createErrorResponse("Forbidden", 403, "FORBIDDEN");
    }

    // 3. Role-based filtering for list endpoints
    const conditions = [];
    if (user.role === "tenant_admin") {
      conditions.push(eq(table.tenantId, user.tenantId));
    }
    
    // ... rest of endpoint logic
  } catch (error) {
    return handleDatabaseError(error);
  }
}
```

### Write Operation Protection

```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Check if user can perform write operations
    if (!canPerformWriteOperation(user)) {
      return createErrorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }

    // ... rest of logic
  } catch (error) {
    return handleDatabaseError(error);
  }
}
```

## 🌍 Applied Endpoints

### ✅ Fully Protected Endpoints

- **TenantMembers**: `/api/tenant-members`
  - GET: Role-based filtering by tenant
  - POST: Tenant access validation
  - DELETE: Tenant ownership check

- **Clients**: `/api/clients` 
  - GET: Tenant-scoped listings
  - POST: Tenant access validation
  - PATCH/DELETE: Client ownership verification

- **Branches**: `/api/branches`
  - GET: Tenant + client scoped access
  - POST: Client access validation
  - PATCH/DELETE: Branch ownership verification

- **Assignments**: `/api/assignments`
  - GET: Client-scoped filtering
  - POST: Client access validation  
  - PATCH/DELETE: Assignment ownership verification

- **Invoices**: `/api/invoices`
  - GET: Tenant-scoped via contracts
  - POST: Contract access validation
  - PATCH/DELETE: Invoice ownership verification

- **Subscriptions**: `/api/subscriptions`
  - GET: Tenant-scoped filtering
  - POST: Tenant access validation
  - PATCH/DELETE: Subscription ownership verification

- **SubscriptionPlans**: `/api/subscription-plans` (Global)
  - GET: Public access for viewing
  - POST/PATCH/DELETE: Admin-only operations

## 🚫 Error Responses

### Authentication Errors
- `401 Unauthorized` - No valid session found
- `401 UNAUTHORIZED` - Session invalid or expired

### Authorization Errors  
- `403 Forbidden` - User lacks required role
- `403 FORBIDDEN` - User cannot access specific resource
- `403 Forbidden: Insufficient permissions` - Cannot perform write operation
- `403 Forbidden: Cannot access this tenant/client` - Resource ownership violation

## 🔧 Usage Examples

### Frontend API Calls

```typescript
// Include session cookie or auth header
const response = await fetch('/api/clients', {
  headers: {
    'Authorization': 'Bearer ' + userToken,
    // or rely on httpOnly session cookie
  }
});

// Check response status
if (response.status === 401) {
  // Redirect to login
}
if (response.status === 403) {
  // Show access denied message
}
```

### Creating Resources

```typescript
// POST /api/clients
{
  "name": "New Client",
  "tenantId": "tenant_123", // Must be accessible to current user
  "phone": "+1234567890"
}
```

### Scoped Queries

```typescript
// GET /api/assignments?clientId=client_456
// Only returns assignments if user has access to client_456
```

## 🔄 Session Management

### Login Flow
1. Validate user credentials
2. Create session with `setSessionCookie(userId)`
3. Store session in httpOnly cookie

### Logout Flow  
1. Call `clearSessionCookie()`
2. Invalidate session on client

### Token Support
- Authorization header: `Bearer <token>`
- Token should contain or resolve to user ID
- Implement proper JWT validation in production

## 🔒 Security Considerations

1. **Session Security**: Use httpOnly, secure cookies
2. **CSRF Protection**: Implement CSRF tokens for state-changing operations
3. **Rate Limiting**: Add rate limiting to auth endpoints
4. **Audit Logging**: Log all authorization failures
5. **Token Validation**: Implement proper JWT signature verification
6. **Session Expiration**: Implement sliding session expiration

This authentication and authorization system provides comprehensive protection while maintaining flexibility for different user roles and access patterns in your multi-tenant SaaS platform. 