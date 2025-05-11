"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User as UserIcon, Shield, Key } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/db/schema";
import useSWR from "swr";

interface UserProfileProps {}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserProfilePage({}: UserProfileProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch current user data
  const { data: user, error: userError, mutate: refreshUser } = useSWR<User | null>("/api/user", fetcher);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email);
      setLoading(false);
    }
  }, [user]);

  // Handle unauthorized access
  useEffect(() => {
    if (userError) {
      toast.error("Failed to load user data");
      router.push("/auth/login");
    }
  }, [userError, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    setUpdatingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
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
    <div className="container mx-auto py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Profile" }
        ]}
      />

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.imageUrl || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-orange-100 text-orange-800">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : <UserIcon />}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{user?.name || "User"}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Role:</span>
                <span className="capitalize">{user?.role}</span>
              </div>
              {user?.organizationId && (
                <div className="flex items-center space-x-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Organization ID:</span>
                  <span className="text-xs truncate">{user.organizationId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit"
                      className="bg-orange-400 hover:bg-orange-300"
                      disabled={updatingProfile}
                    >
                      {updatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit"
                      className="bg-orange-400 hover:bg-orange-300"
                      disabled={updatingPassword}
                    >
                      {updatingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 