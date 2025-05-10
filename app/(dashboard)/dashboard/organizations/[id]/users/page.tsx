"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { AddUserDialog } from "./add-user-dialog";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  users: User[];
}

export default function OrganizationUsersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const res = await fetch(`/api/organization/${id}`);
        if (!res.ok) throw new Error("Failed to fetch organization");
        const orgData = await res.json();
        
        // Fetch users for this organization
        const usersRes = await fetch(`/api/organization/${id}/users`);
        if (!usersRes.ok) throw new Error("Failed to fetch users");
        const usersData = await usersRes.json();
        
        setOrganization({
          id: orgData.id,
          name: orgData.name,
          users: usersData
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load organization data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganization();
    }
  }, [id]);

  const handleRemoveUser = async (userId: string) => {
    if (!organization) return;
    
    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/organization/${id}/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove user");
      
      setOrganization({
        ...organization,
        users: organization.users.filter(user => user.id !== userId)
      });
      
      toast.success("User removed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove user");
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg mb-4">Organization not found</p>
        <Button 
          onClick={() => router.push("/dashboard/organizations")}
          className="bg-orange-400 text-white hover:bg-orange-300"
        >
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{organization.name} - Users</h1>
          <p className="text-muted-foreground">Manage users in this organization</p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => router.push(`/dashboard/organizations/${id}`)}
            variant="outline"
          >
            Organization Details
          </Button>
          <AddUserDialog organizationId={id as string} onUserAdded={(user) => {
            setOrganization({
              ...organization,
              users: [...organization.users, user]
            });
          }} />
        </div>
      </div>

      {organization.users.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={deletingUserId === user.id}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      {deletingUserId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">No users in this organization yet</p>
          <AddUserDialog organizationId={id as string} onUserAdded={(user) => {
            setOrganization({
              ...organization,
              users: [...organization.users, user]
            });
          }} />
        </div>
      )}
    </div>
  );
} 