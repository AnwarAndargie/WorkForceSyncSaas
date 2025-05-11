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
  ChevronRight,
  Home,
  UserPlus,
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
import { Breadcrumb } from "@/components/ui/breadcrumb";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Type for organization analytics
type OrganizationAnalytics = {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalRevenue: number;
  freeTrial: number;
  isPaid: number;
};

// Type for org admin analytics
type OrgAdminAnalytics = {
  totalUsers: number;
  activeUsers: number;
  conversionRate: number;
  activeMembersCount: number;
  newUsersThisMonth: number;
  totalEarnings: number;
};

// Type for recent members data
type MemberData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  dateAdded: string;
}

export default function DashboardPage() {
  const { data: user, error: userError, isLoading: userLoading } = useSWR<User>("/api/user", fetcher);
  const { data: organizations, error: orgsError, isLoading: orgsLoading } = 
    useSWR<Organization[]>(user?.role === "super_admin" ? "/api/organizations" : null, fetcher);
  const { data: plans, error: plansError, isLoading: plansLoading } = 
    useSWR<Plan[]>(user?.role === "super_admin" ? "/api/plans" : null, fetcher);
  
  // Fetch org-specific data for org_admin
  const { data: orgUsers, error: orgUsersError, isLoading: orgUsersLoading } = 
    useSWR<User[]>(user?.role === "org_admin" && user?.organizationId ? `/api/organization/${user.organizationId}/users` : null, fetcher);
  
  const { data: orgData, error: orgDataError, isLoading: orgDataLoading } = 
    useSWR<Organization>(user?.role === "org_admin" && user?.organizationId ? `/api/organization/${user.organizationId}` : null, fetcher);

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

  // Calculated analytics for org admin
  const orgAdminAnalytics: OrgAdminAnalytics | null = orgUsers ? {
    totalUsers: orgUsers.length,
    activeUsers: orgUsers.filter(user => user.isActive).length,
    conversionRate: orgUsers.length > 0 ? Math.round((orgUsers.filter(user => user.isActive).length / orgUsers.length) * 100) : 0,
    activeMembersCount: orgUsers.filter(user => user.isActive && user.role === "member").length,
    newUsersThisMonth: orgUsers.filter(user => {
      if (!user.createdAt) return false;
      const createdDate = new Date(user.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length,
    totalEarnings: orgData?.planId ? (plans?.find(p => p.id === orgData.planId)?.price || 0) * 12 : 0,
  } : null;

  // Generate time series data for user activity (org admin)
  const getUserActivityData = () => {
    if (!orgUsers) return [];
    
    const now = new Date();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = `Day ${i + 1}`;
      
      // Count users who logged in on this day (this is mock data, replace with real data)
      const activeCount = Math.floor(Math.random() * 20);
      // Count users who were created on this day (based on real data if possible)
      const newCount = orgUsers.filter(user => {
        if (!user.createdAt) return false;
        const createdDate = new Date(user.createdAt);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({ 
        date: dateKey, 
        active: activeCount, 
        new: newCount 
      });
    }
    
    return data;
  };

  // Prepare recent members data for org admin
  const getRecentMembers = (): MemberData[] => {
    if (!orgUsers) return [];
    
    return orgUsers
      .slice(0, 5)
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dateAdded: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'
      }));
  };

  // Generate subscription data for chart (super admin)
  const subscriptionData = plans?.map(plan => ({
    name: plan.name,
    value: organizations?.filter(org => org.planId === plan.id).length || 0,
  })) || [];

  // Generate time series data for new organizations (super admin)
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

  // Organization table columns (super admin)
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

  if (isOrgAdmin && (orgUsersLoading || orgDataLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  // Org admin quick actions
  const quickActions = [
    { icon: Upload, label: "Import Members", href: "/dashboard/members/import" },
    { icon: Download, label: "Export Members", href: "/dashboard/members" },
    { icon: UserPlus, label: "Invite Member", href: "/dashboard/members/invite" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="flex-1 p-4 space-y-6">
      <Breadcrumb 
        items={[
          { 
            label: "Dashboard", 
            icon: user?.role === "super_admin" ? <Building className="h-4 w-4" /> : <Users className="h-4 w-4" /> 
          }
        ]} 
      />
      
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
          
          {/* Rest of super admin dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} organizations`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Signups</CardTitle>
                <p className="text-sm text-gray-500">
                  New organizations in the last 7 days
                </p>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getRecentSignups()}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Subdomain</th>
                        <th className="text-left py-3 px-4 font-medium">Plan</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Created</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrganizations?.map((org) => (
                        <tr key={org.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{org.name}</td>
                          <td className="py-3 px-4">{org.subdomain}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {org.plan}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              org.status === 'active' ? 'bg-green-100 text-green-800' : 
                              org.status === 'trialing' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {org.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{org.created}</td>
                          <td className="py-3 px-4">
                            <Link href={`/dashboard/organizations/${org.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                View <ChevronRight className="h-4 w-4" />
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
                    <Button className="bg-orange-400 text-white hover:bg-orange-300 w-full">
                      View All Organizations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-2 p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/dashboard/organizations/create">
                  <div className="p-4 border rounded-md hover:shadow-md transition cursor-pointer flex items-center gap-3">
                    <Building className="h-5 w-5 text-orange-500" />
                    <div>Create Organization</div>
                  </div>
                </Link>
                <Link href="/dashboard/plans/new">
                  <div className="p-4 border rounded-md hover:shadow-md transition cursor-pointer flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    <div>Create Plan</div>
                  </div>
                </Link>
                <Link href="/dashboard/users">
                  <div className="p-4 border rounded-md hover:shadow-md transition cursor-pointer flex items-center gap-3">
                    <Users className="h-5 w-5 text-orange-500" />
                    <div>Manage Users</div>
                  </div>
                </Link>
                <Link href="/dashboard/settings">
                  <div className="p-4 border rounded-md hover:shadow-md transition cursor-pointer flex items-center gap-3">
                    <Settings className="h-5 w-5 text-orange-500" />
                    <div>System Settings</div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>API Status</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Storage</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    85% Free
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Email Service</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Active
                  </span>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/system/logs">
                    <Button variant="outline" className="w-full">
                      View System Logs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isOrgAdmin && orgAdminAnalytics && (
        <>
          <h1 className="text-2xl font-bold mb-4">Organization Overview</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <Users className="h-6 w-6 text-blue-500 mb-2" />
                <CardTitle className="text-lg">Total Users</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">{orgAdminAnalytics.totalUsers}</p>
                <p className="text-sm text-gray-500">
                  {orgAdminAnalytics.newUsersThisMonth > 0 && `+${orgAdminAnalytics.newUsersThisMonth} this month`}
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <Activity className="h-6 w-6 text-green-500 mb-2" />
                <CardTitle className="text-lg">Active Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">{orgAdminAnalytics.conversionRate}%</p>
                <p className="text-sm text-gray-500">{orgAdminAnalytics.activeUsers} active users</p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <Users className="h-6 w-6 text-orange-500 mb-2" />
                <CardTitle className="text-lg">Active Members</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">{orgAdminAnalytics.activeMembersCount}</p>
                <p className="text-sm text-gray-500">Regular members</p>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CreditCard className="h-6 w-6 text-purple-500 mb-2" />
                <CardTitle className="text-lg">Yearly Value</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-bold">${orgAdminAnalytics.totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Based on your plan</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users Activity</CardTitle>
                <p className="text-sm text-gray-500">
                  User activity over the last 30 days
                </p>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getUserActivityData()}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="active" name="Active Users" fill="#4f46e5" />
                    <Bar dataKey="new" name="New Users" fill="#22c55e" />
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
                  {getRecentMembers().map((member) => (
                    <li
                      key={member.id}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{member.name || member.email}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs mt-1">
                          {member.role}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {member.dateAdded}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/members">
                  <Button className="bg-orange-400 text-white hover:bg-orange-300 mt-4 w-full">
                    View All Members
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map(({ icon: Icon, label, href }, idx) => (
                <Link href={href} key={idx}>
                  <Card className="flex items-center p-4 space-x-4 hover:shadow-md transition cursor-pointer h-full">
                    <div className="p-2 rounded-md bg-gray-100">
                      <Icon className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{label}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            
            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Current Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Plan:</strong> {orgData?.planId ? plans?.find(p => p.id === orgData.planId)?.name || 'Unknown Plan' : 'No Plan'}
                </p>
                <p>
                  <strong>Status:</strong> {orgData?.stripeSubscriptionStatus || 'Inactive'}
                </p>
                <p>
                  <strong>Next Billing Date:</strong> {orgData?.stripeSubscriptionCurrentPeriodEnd ? 
                    new Date(orgData.stripeSubscriptionCurrentPeriodEnd * 1000).toLocaleDateString() : 
                    'Not Available'}
                </p>
                <p>
                  <strong>Amount:</strong> ${orgData?.planId ? (plans?.find(p => p.id === orgData.planId)?.price || 0).toFixed(2) : '0.00'}/month
                </p>
                <form action={customerPortalAction}>
                  <Button
                    className="bg-orange-400 text-white hover:bg-orange-300 mt-3 w-full"
                    type="submit"
                  >
                    Manage Subscription
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
