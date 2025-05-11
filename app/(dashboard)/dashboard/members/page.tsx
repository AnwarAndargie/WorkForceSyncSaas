"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, MailOpen, RefreshCw, Search, Trash, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getUser } from "@/lib/db/queries/users";
import { User } from "@/lib/db/schema";
import useSWR from "swr";

interface UserWithStatus {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  status?: string;
  organizationId?: string;
  passwordHash?: string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  isActive?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  // Fetch current user and check if they are org_admin
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getUser();
        setCurrentUser(user);

        if (!user || user.role !== "org_admin") {
          router.push("/dashboard");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load user data");
        router.push("/dashboard");
      }
    };

    checkUser();
  }, [router]);

  // Fetch organization users
  const { data: users, error: usersError, isLoading: usersLoading, mutate: refreshUsers } = 
    useSWR<UserWithStatus[]>(
      currentUser?.organizationId ? `/api/organization/${currentUser.organizationId}/users` : null, 
      fetcher
    );

  // Fetch invitations
  const { data: invitations, error: invitationsError, isLoading: invitationsLoading, mutate: refreshInvitations } = 
    useSWR<any[]>(
      currentUser?.organizationId ? `/api/organization/${currentUser.organizationId}/invitations` : null, 
      fetcher
    );

  // Combine users and invitations
  const allMembers: UserWithStatus[] = [...(users || [])];
  
  if (invitations) {
    const pendingInvitations = invitations
      .filter(inv => inv.status === 'pending')
      .map(inv => ({
        id: inv.id,
        email: inv.invitedUserEmail,
        name: "Invited User",
        role: inv.role,
        status: 'pending'
      }));
    
    allMembers.push(...pendingInvitations);
  }

  // Filter members based on search term
  const filteredMembers = searchTerm 
    ? allMembers.filter(member => 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allMembers;

  const handleRemoveUser = async (userId: string) => {
    if (!currentUser?.organizationId) return;
    
    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/organization/${currentUser.organizationId}/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove user");
      
      toast.success("User removed successfully");
      refreshUsers();
      refreshInvitations();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleExportUsers = async () => {
    if (!currentUser?.organizationId) return;
    
    setExporting(true);
    try {
      const res = await fetch(`/api/organization/${currentUser.organizationId}/users/export`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Failed to export users");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "organization-members.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Members exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export members");
    } finally {
      setExporting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!currentUser?.organizationId) return;
    
    setResendingInviteId(invitationId);
    
    try {
      const res = await fetch(`/api/organization/${currentUser.organizationId}/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Failed to resend invitation");
      
      toast.success("Invitation resent successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to resend invitation");
    } finally {
      setResendingInviteId(null);
    }
  };

  if (loading || usersLoading || invitationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members" }
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organization Members</h1>
          <p className="text-muted-foreground">Manage users in your organization</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members..."
              className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleExportUsers}
            variant="outline"
            disabled={exporting}
            className="gap-2 w-full sm:w-auto"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export
          </Button>
          <Button
            onClick={() => router.push("/dashboard/members/import")}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            onClick={() => router.push("/dashboard/members/invite")}
            className="bg-orange-400 text-white hover:bg-orange-300 gap-2 w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name || "N/A"}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  <TableCell>
                    {member.status === 'pending' ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <MailOpen className="mr-1 h-3 w-3" /> Invited
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {member.status === 'pending' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendInvitation(member.id)}
                          disabled={resendingInviteId === member.id}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Resend invitation"
                        >
                          {resendingInviteId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                      {/* Don't show delete button for current user */}
                      {member.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(member.id)}
                          disabled={deletingUserId === member.id}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title={member.status === 'pending' ? "Cancel invitation" : "Remove user"}
                        >
                          {deletingUserId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">No members found</p>
          <Button
            onClick={() => router.push("/dashboard/members/invite")}
            className="bg-orange-400 text-white hover:bg-orange-300"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Invite User
          </Button>
        </div>
      )}
    </div>
  );
}
