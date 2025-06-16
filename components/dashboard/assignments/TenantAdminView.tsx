"use client";

import { useState, useEffect } from "react";
import { SessionUser } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, User, Clock } from "lucide-react";
import { CreateAssignmentDialog } from "./CreateAssignmentDialog";
import { CreateEventDialog } from "./CreateEventDialog";

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

interface Event {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  branchId: string;
  clientId: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  createdAt: string;
  branchName: string;
  branchAddress: string;
  clientName: string;
}

interface TenantAdminViewProps {
  user: SessionUser;
}

export function TenantAdminView({ user }: TenantAdminViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchEvents();
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
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
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
      case "scheduled":
        return "bg-purple-100 text-purple-800";
      case "ongoing":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => setShowCreateEvent(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 "
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
        <Button
          onClick={() => setShowCreateAssignment(true)}
          variant="outline"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 "
        >
          <Plus className="h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      {/* Events Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Events</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{event.name}</span>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.startTime).toLocaleTimeString()} -{" "}
                      {new Date(event.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{event.branchName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{event.clientName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {events.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No events found. Create your first event to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assignments Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Assignments</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
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
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{assignment.employeeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{assignment.branchName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(assignment.eventStartTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(assignment.eventStartTime).toLocaleTimeString()}{" "}
                      - {new Date(assignment.eventEndTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {assignments.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No assignments found. Create events and assign employees to get
                started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        onEventCreated={() => {
          fetchEvents();
          setShowCreateEvent(false);
        }}
      />
      <CreateAssignmentDialog
        open={showCreateAssignment}
        onOpenChange={setShowCreateAssignment}
        events={events}
        onAssignmentCreated={() => {
          fetchAssignments();
          setShowCreateAssignment(false);
        }}
      />
    </div>
  );
}
