"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import useSWR from "swr";
import { SessionUser } from "@/lib/auth/types";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    return res.json();
  });

export function SettingsDashboard() {
  const [accountForm, setAccountForm] = useState<SessionUser>();
  const { data: user } = useSWR<SessionUser>("api/user", fetcher);
  const [securityForm, setSecurityForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailUpdates: true,
    newFeatures: true,
    marketingEmails: false,
    securityAlerts: true,
  });

  const handleAccountFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (
    setting: keyof typeof notificationSettings
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userReponse = await fetch("api/user");
        const user = await userReponse.json();
        setAccountForm(user);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUser();
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={accountForm?.name}
                  value={accountForm?.name}
                  onChange={handleAccountFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={accountForm?.email}
                  onChange={handleAccountFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Role</Label>
                <Input
                  id="company"
                  name="company"
                  value={accountForm?.role}
                  onChange={handleAccountFormChange}
                />
              </div>
              <Button className="mt-4 bg-orange-600 hover:bg-orange-500">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={securityForm.newPassword}
                  onChange={handleSecurityFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={handleSecurityFormChange}
                />
              </div>
              <Button className="mt-4 bg-orange-600 hover:bg-orange-500">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Email Updates</p>
                  <p className="text-sm text-gray-500">
                    Receive updates about your account via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailUpdates}
                  onCheckedChange={() =>
                    handleNotificationToggle("emailUpdates")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">New Features</p>
                  <p className="text-sm text-gray-500">
                    Get notified when we release new features
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.newFeatures}
                  onCheckedChange={() =>
                    handleNotificationToggle("newFeatures")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-gray-500">
                    Receive marketing emails and promotions
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={() =>
                    handleNotificationToggle("marketingEmails")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-sm text-gray-500">
                    Get important security alerts and notifications
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={() =>
                    handleNotificationToggle("securityAlerts")
                  }
                />
              </div>
              <Button className="mt-4 bg-orange-600 hover:bg-orange-500">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
