"use client";

import { useState, useEffect } from "react";
import { SessionUser } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Clock, CheckCircle, XCircle } from "lucide-react";

interface Assignment {
  id: string;
  employeeId: string;
  eventId: string;
  branchId: string;
  clientId: string;
  startDate: string | null;
  endDate: string | null;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string;
  employeeName: string;
  employeeEmail: string;
  clientName: string;
  eventName: string;
  eventDescription: string;
  eventStartTime: string;
  eventEndTime: string;
  branchName: string;
  branchAddress: string;
}

interface EmployeeViewProps {
  user: SessionUser;
}

export function EmployeeView({ user }: EmployeeViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: "accepted" | "rejected") => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh assignments
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === "pending");
  const acceptedAssignments = assignments.filter(a => a.status === "accepted");
  const otherAssignments = assignments.filter(a => !["pending", "accepted"].includes(a.status));

  return (
    <div className="space-y-6">
      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-700">Pending Assignments</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{assignment.eventName}</span>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{assignment.eventDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{assignment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{assignment.branchName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(assignment.eventStartTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(assignment.eventStartTime).toLocaleTimeString()} - {new Date(assignment.eventEndTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateAssignmentStatus(assignment.id, "accepted")}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAssignmentStatus(assignment.id, "rejected")}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Assignments */}
      {acceptedAssignments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-green-700">Accepted Assignments</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {acceptedAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{assignment.eventName}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{assignment.eventDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{assignment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{assignment.branchName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(assignment.eventStartTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(assignment.eventStartTime).toLocaleTimeString()} - {new Date(assignment.eventEndTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Assignments */}
      {otherAssignments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Assignment History</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{assignment.eventName}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{assignment.eventDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{assignment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{assignment.branchName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(assignment.eventStartTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(assignment.eventStartTime).toLocaleTimeString()} - {new Date(assignment.eventEndTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Assignments */}
      {assignments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No assignments found. You'll see your assignments here when they're created.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 