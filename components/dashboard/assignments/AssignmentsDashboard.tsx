"use client";

import { useState, useEffect } from "react";
import { SessionUser } from "@/lib/auth/types";
import { TenantAdminView } from "./TenantAdminView";
import { EmployeeView } from "./EmployeeView";

interface AssignmentsDashboardProps {
  user: SessionUser;
}

export function AssignmentsDashboard({ user }: AssignmentsDashboardProps) {
  if (user.role === "tenant_admin") {
    return <TenantAdminView user={user} />;
  }

  if (user.role === "employee") {
    return <EmployeeView user={user} />;
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Access denied. Invalid role.</p>
    </div>
  );
} 