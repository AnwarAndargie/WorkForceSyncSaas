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
  Trophy,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { customerPortalAction } from "@/lib/payments/actions";
import useSWR from "swr";
import { User } from "@/lib/db/schema";
const fetcher = (url: string) => fetch(url).then((res) => res.json());
// Mock types based on schema.ts
type Quiz = {
  id: string;
  title: string;
  userId: string;
  teamId: string;
  organizationId: string;
  score: number;
  totalQuestions: number;
  completedAt?: Date;
  createdAt: Date;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  userId: string;
  teamId: string;
  organizationId: string;
  dueDate: Date;
  isCompleted: boolean;
  createdAt: Date;
};

// Mock data functions
async function getOrganizationAnalytics(): Promise<{
  totalOrganizations: number;
  activeSubscriptions: number;
  totalRevenue: number;
}> {
  return {
    totalOrganizations: 50,
    activeSubscriptions: 30,
    totalRevenue: 1499.7, // 30 * $49.99
  };
}

async function getUserQuizAnalytics(
  userId: string,
  teamId: string | null
): Promise<{
  totalQuizzes: number;
  averageScore: number;
  teamRank: number;
}> {
  return {
    totalQuizzes: 10,
    averageScore: 85,
    teamRank: 3,
  };
}

async function getUpcomingQuizzes(
  userId: string,
  limit: number = 5
): Promise<Quiz[]> {
  return [
    {
      id: "quiz-1",
      title: "Team Quiz 1",
      userId,
      teamId: "team-123",
      organizationId: "org-123",
      score: 0,
      totalQuestions: 20,
      createdAt: new Date("2025-05-01"),
    },
    {
      id: "quiz-2",
      title: "Product Knowledge Quiz",
      userId,
      teamId: "team-123",
      organizationId: "org-123",
      score: 0,
      totalQuestions: 15,
      createdAt: new Date("2025-05-02"),
    },
    {
      id: "quiz-3",
      title: "Weekly Challenge",
      userId,
      teamId: "team-123",
      organizationId: "org-123",
      score: 0,
      totalQuestions: 10,
      createdAt: new Date("2025-05-03"),
    },
  ].slice(0, limit);
}

async function getUpcomingTasks(
  userId: string,
  limit: number = 5
): Promise<Task[]> {
  return [
    {
      id: "task-1",
      title: "Complete Project Proposal",
      description: "Draft the proposal for the new client.",
      userId,
      teamId: "team-123",
      organizationId: "org-123",
      dueDate: new Date("2025-05-10"),
      isCompleted: false,
      createdAt: new Date("2025-05-01"),
    },
    {
      id: "task-2",
      title: "Review Team Metrics",
      description: "Analyze quiz performance for the team.",
      userId,
      teamId: "team-123",
      organizationId: "org-123",
      dueDate: new Date("2025-05-12"),
      isCompleted: false,
      createdAt: new Date("2025-05-02"),
    },
  ].slice(0, limit);
}

// Mock data for org_admin (same as provided)
const leadData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  acquired: Math.floor(Math.random() * 50),
  converted: Math.floor(Math.random() * 30),
}));

const recentLeads = [
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
  { icon: Upload, label: "Import Leads" },
  { icon: Download, label: "Export Leads" },
  { icon: FileText, label: "Generate Reports" },
  { icon: Settings, label: "System Settings" },
];

export default function DashboardPage() {
  const [orgAnalytics, setOrgAnalytics] = useState<{
    totalOrganizations: number;
    activeSubscriptions: number;
    totalRevenue: number;
  } | null>({
    totalOrganizations: 50,
    activeSubscriptions: 30,
    totalRevenue: 1499.7,
  });
  const [quizAnalytics, setQuizAnalytics] = useState<{
    totalQuizzes: number;
    averageScore: number;
    teamRank: number;
  } | null>({ totalQuizzes: 10, averageScore: 85, teamRank: 3 });
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const { data: user } = useSWR<User>("/api/user", fetcher);

  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       const userData = await getUser();
  //       if (!userData) {
  //         throw new Error("User not found");
  //       }
  //       setUser(userData);

  //       const userWithTeam = await getUserWithTeam();
  //       setTeamId(userWithTeam?.teamId || null);

  //       if (userData.role === "super_admin") {
  //         const analytics = await getOrganizationAnalytics();
  //         setOrgAnalytics(analytics);
  //       } else if (["team_lead", "member"].includes(userData.role)) {
  //         const quizData = await getUserQuizAnalytics(
  //           userData.id,
  //           userWithTeam?.teamId || null
  //         );
  //         const quizzes = await getUpcomingQuizzes(userData.id);
  //         const tasks = await getUpcomingTasks(userData.id);
  //         setQuizAnalytics(quizData);
  //         setUpcomingQuizzes(quizzes);
  //         setUpcomingTasks(tasks);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching dashboard data:", error);
  //     }
  //   }
  //   fetchData();
  // }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  const isSuperAdmin = user.role === "super_admin";
  const isOrgAdmin = user.role === "org_admin";
  const isTeamMember = user.role === "team_lead" || user.role === "member";

  return (
    <div className="flex-1 p-4 space-y-6">
      {isSuperAdmin && orgAnalytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <CardTitle>Total Organizations</CardTitle>
              <p className="text-2xl font-bold">
                {orgAnalytics.totalOrganizations}
              </p>
              <p className="text-sm text-gray-500">Across the platform</p>
            </Card>
            <Card className="p-4">
              <CardTitle>Active Subscriptions</CardTitle>
              <p className="text-2xl font-bold">
                {orgAnalytics.activeSubscriptions}
              </p>
              <p className="text-sm text-gray-500">Currently active</p>
            </Card>
            <Card className="p-4">
              <CardTitle>Total Revenue</CardTitle>
              <p className="text-2xl font-bold">
                ${orgAnalytics.totalRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">From subscriptions</p>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <p className="text-sm text-gray-500">
                Subscription trends across organizations.
              </p>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "Active Subscriptions",
                      value: orgAnalytics.activeSubscriptions,
                    },
                    {
                      name: "Total Organizations",
                      value: orgAnalytics.totalOrganizations,
                    },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {isOrgAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: "1,200", change: "+10%" },
              { label: "Conversion Rate", value: "25%", change: "-2%" },
              { label: "Active Leads", value: "300", change: "+5%" },
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
              <CardTitle>Leads Overview</CardTitle>
              <p className="text-sm text-gray-500">
                Lead acquisition and conversion over the last 30 days.
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
              <CardTitle>Recent Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p>{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {lead.dateAdded}
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="bg-orange-400 text-white hover:bg-orange-300 mt-3 cursor-pointer">
                View All Leads
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

      {isTeamMember && quizAnalytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <CardTitle>Total Quizzes Completed</CardTitle>
              <p className="text-2xl font-bold">{quizAnalytics.totalQuizzes}</p>
              <p className="text-sm text-gray-500">All time</p>
            </Card>
            <Card className="p-4">
              <CardTitle>Average Quiz Score</CardTitle>
              <p className="text-2xl font-bold">
                {quizAnalytics.averageScore.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Across all quizzes</p>
            </Card>
            <Card className="p-4">
              <CardTitle>Team Rank</CardTitle>
              <p className="text-2xl font-bold">{quizAnalytics.teamRank}</p>
              <p className="text-sm text-gray-500">In your team</p>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {upcomingQuizzes.length > 0 ? (
                  upcomingQuizzes.map((quiz: Quiz) => (
                    <li
                      key={quiz.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p>{quiz.title}</p>
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Start Quiz
                      </Button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No upcoming quizzes.</p>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task: Task) => (
                    <li
                      key={task.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p>{task.title}</p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Mark Complete
                      </Button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No upcoming tasks.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
