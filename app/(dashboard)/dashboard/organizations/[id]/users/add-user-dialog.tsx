"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AddUserDialogProps {
  organizationId: string;
  onUserAdded: (user: User) => void;
}

export function AddUserDialog({ organizationId, onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/organization/${organizationId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add user");
      }

      const newUser = await res.json();
      toast.success("User invitation sent successfully");
      onUserAdded(newUser);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setName("");
    setRole("member");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-orange-400 text-white hover:bg-orange-300">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Invite a user to join this organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
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
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-400 text-white hover:bg-orange-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Invitation...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 