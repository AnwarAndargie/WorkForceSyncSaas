export interface SessionUser {
  id: string;
  role: "super_admin" | "tenant_admin" | "client_admin" | "employee";
  name?: string;
  email?: string;
  tenantId?: string;
  clientId?: string;
}

export interface SessionData {
  user: SessionUser;
  expires: string;
}

export interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
} 