"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  Download,
  FileText,
  Settings,
  Calendar,
  Users,
  Building,
  CreditCard,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { customerPortalAction } from "@/lib/payments/actions";
import useSWR from "swr";
import { User, Organization, Plan } from "@/lib/db/schema";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Type for organization analytics
type OrganizationAnalytics = {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalRevenue: number;
  freeTrial: number;
  isPaid: number;
};

// Type for user activity data
type UserActivity = {
  id: string;
  name: string;
  email: string;
  action: string;
  timestamp: string;
};

export default function DashboardPage() {
  const { data: user, error: userError, isLoading: userLoading } = useSWR<User>("/api/user", fetcher);
  const { data: organizations, error: orgsError, isLoading: orgsLoading } = 
    useSWR<Organization[]>(user?.role === "super_admin" ? "/api/organizations" : null, fetcher);
  const { data: plans, error: plansError, isLoading: plansLoading } = 
    useSWR<Plan[]>(user?.role === "super_admin" ? "/api/plans" : null, fetcher);
  
  // Calculated analytics for super admin
  const orgAnalytics: OrganizationAnalytics | null = organizations ? {
    totalOrganizations: organizations.length,
    activeSubscriptions: organizations.filter(org => 
      org.stripeSubscriptionStatus === "active" || 
      org.stripeSubscriptionStatus === "trialing"
    ).length,
    totalRevenue: organizations.reduce((sum, org) => {
      const plan = plans?.find(p => p.id === org.planId);
      return sum + (plan?.price || 0);
    }, 0),
    freeTrial: organizations.filter(org => org.stripeSubscriptionStatus === "trialing").length,
    isPaid: organizations.filter(org => org.stripeSubscriptionStatus === "active").length,
  } : null;

  // Generate subscription data for chart
  const subscriptionData = plans?.map(plan => ({
    name: plan.name,
    value: organizations?.filter(org => org.planId === plan.id).length || 0,
  })) || [];

  // Generate time series data for new organizations
  const getRecentSignups = () => {
    if (!organizations) return [];
    
    const now = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'MMM dd');
      
      const count = organizations.filter(org => {
        const orgCreatedAt = org.createdAt;
        if (!orgCreatedAt) return false;
        const orgDate = new Date(orgCreatedAt);
        return orgDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({ name: dateStr, count });
    }
    
    return data;
  };

  // Organization table columns
  const recentOrganizations = organizations?.slice(0, 5).map(org => ({
    id: org.id,
    name: org.name,
    subdomain: org.subdomain,
    plan: plans?.find(p => p.id === org.planId)?.name || 'No Plan',
    status: org.stripeSubscriptionStatus || 'None',
    created: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Unknown'
  }));

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  if (userError) {
    return <div>Error loading user data</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const isSuperAdmin = user.role === "super_admin";
  const isOrgAdmin = user.role === "org_admin";

  if (isSuperAdmin && orgsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  // Mock data for org_admin (same as provided)
  const leadData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    acquired: Math.floor(Math.random() * 50),
    converted: Math.floor(Math.random() * 30),
  }));

  const recentMembers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      dateAdded: "Apr 1, 2025",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      dateAdded: "Apr 2, 2025",
    },
    {
      id: 3,
      name: "Alice Brown",
      email: "alice@example.com",
      dateAdded: "Apr 3, 2025",
    },
  ];

  const quickActions = [
    { icon: Upload, label: "Import Members" },
    { icon: Download, label: "Export Members" },
    { icon: FileText, label: "Generate Reports" },
    { icon: Settings, label: "System Settings" },
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="flex-1 p-4 space-y-6">
      {isSuperAdmin && orgAnalytics && (
        <>
          <h1 className="text-2xl font-bold mb-4">Platform Overview</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <Building className="h-6 w-6 text-orange-500 mb-2" />
                <CardTitle className="text-lg">Organizations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">
                  {orgAnalytics.totalOrganizations}
                </p>
                <p className="text-sm text-gray-500">Total registered</p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CreditCard className="h-6 w-6 text-green-500 mb-2" />
                <CardTitle className="text-lg">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">
                  {orgAnalytics.activeSubscriptions}
                </p>
                <p className="text-sm text-gray-500">Currently active</p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <Calendar className="h-6 w-6 text-blue-500 mb-2" />
                <CardTitle className="text-lg">Trial Accounts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">{orgAnalytics.freeTrial}</p>
                <p className="text-sm text-gray-500">In trial period</p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <Activity className="h-6 w-6 text-purple-500 mb-2" />
                <CardTitle className="text-lg">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">
                  {orgAnalytics.isPaid ? 
                    `${Math.round((orgAnalytics.isPaid / orgAnalytics.totalOrganizations) * 100)}%` : 
                    '0%'}
                </p>
                <p className="text-sm text-gray-500">Trial to paid</p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <AlertCircle className="h-6 w-6 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">
                  ${orgAnalytics.totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">From subscriptions</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>New Organizations (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getRecentSignups()}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#FF8042" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">Subdomain</th>
                      <th className="text-left p-2 border-b">Plan</th>
                      <th className="text-left p-2 border-b">Status</th>
                      <th className="text-left p-2 border-b">Created</th>
                      <th className="text-left p-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrganizations?.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="p-2 border-b">{org.name}</td>
                        <td className="p-2 border-b">{org.subdomain}</td>
                        <td className="p-2 border-b">{org.plan}</td>
                        <td className="p-2 border-b">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            org.status === 'active' ? 'bg-green-100 text-green-800' :
                            org.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {org.status}
                          </span>
                        </td>
                        <td className="p-2 border-b">{org.created}</td>
                        <td className="p-2 border-b">
                          <Link href={`/dashboard/organizations/${org.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                            >
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4">
                <Link href="/dashboard/organizations">
                  <Button className="bg-orange-400 text-white hover:bg-orange-300">
                    View All Organizations
                  </Button>
                </Link>
                <Link href="/dashboard/plans" className="ml-2">
                  <Button variant="outline">
                    Manage Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>API Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Operational</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Database Connections</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Provider</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Email Service</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/dashboard/organizations/create">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  </Link>
                  <Link href="/dashboard/plans">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Plans
                    </Button>
                  </Link>
                  <Link href="/dashboard/reports">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                  </Link>
                  <Link href="/dashboard/activity">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      View Activity Logs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isOrgAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: "1,200", change: "+10%" },
              { label: "Conversion Rate", value: "25%", change: "-2%" },
              { label: "Active Members", value: "300", change: "+5%" },
              { label: "Potential Revenue", value: "$15,000", change: "+8%" },
            ].map((metric, idx) => (
              <Card key={idx} className="p-4">
                <CardTitle>{metric.label}</CardTitle>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-gray-500">
                  Since last month {metric.change}
                </p>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Members Overview</CardTitle>
              <p className="text-sm text-gray-500">
                Member acquisition and conversion over the last 30 days.
              </p>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="acquired" fill="#4f46e5" />
                  <Bar dataKey="converted" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Members</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p>{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {member.dateAdded}
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="bg-orange-400 text-white hover:bg-orange-300 mt-3 cursor-pointer">
                View All Members
              </Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map(({ icon: Icon, label }, idx) => (
                <Card
                  key={idx}
                  className="flex items-center p-4 space-x-4 hover:shadow-md transition"
                >
                  <div className="p-2 rounded-md bg-gray-100">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{label}</p>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-lg">Current Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Plan:</strong> Pro Plan
                </p>
                <p>
                  <strong>Status:</strong> Active
                </p>
                <p>
                  <strong>Next Billing Date:</strong> June 15, 2025
                </p>
                <p>
                  <strong>Amount:</strong> $49.99/month
                </p>
                <form action={customerPortalAction}>
                  <Button
                    className="bg-orange-400 text-white hover:bg-orange-300 mt-3 cursor-pointer"
                    type="submit"
                  >
                    Change Plan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
