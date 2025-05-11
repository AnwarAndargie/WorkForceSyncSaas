"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getUser } from "@/lib/db/queries/users";

export default function InviteMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "member",
  });

  // Fetch current user
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    if (!currentUser?.organizationId) {
      toast.error("Organization ID is missing");
      return;
    }

    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/organization/${currentUser.organizationId}/users/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || "Failed to invite user");
      }
      
      const result = await res.json();
      toast.success(result.message || "User invitation sent successfully");
      
      // Clear form or redirect
      if (e.nativeEvent instanceof SubmitEvent && 
          e.nativeEvent.submitter instanceof HTMLButtonElement && 
          e.nativeEvent.submitter.name === "inviteAnother") {
        // Clear form for another invitation
        setFormData({
          email: "",
          name: "",
          role: "member",
        });
      } else {
        // Redirect to members page
        router.push("/dashboard/members");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members", href: "/dashboard/members" },
          { label: "Invite" }
        ]}
      />

      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/members")}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Members
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite New Member</CardTitle>
          <CardDescription>
            Send an invitation to join your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="member@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                This will be filled by the user if left blank.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="org_admin">Organization Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-md flex items-center gap-3">
              <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                An email invitation will be sent to this address with instructions to join your organization.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/members")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                name="inviteAnother" 
                variant="outline"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Invite & Add Another
              </Button>
              <Button
                type="submit"
                className="bg-orange-400 text-white hover:bg-orange-300"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Send Invitation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 