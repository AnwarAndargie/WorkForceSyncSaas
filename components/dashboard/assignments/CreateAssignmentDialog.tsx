"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  branchId: string;
  clientId: string;
  branchName: string;
  clientName: string;
}

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  onAssignmentCreated: () => void;
}

export function CreateAssignmentDialog({ 
  open, 
  onOpenChange, 
  events, 
  onAssignmentCreated 
}: CreateAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    eventId: "",
    startDate: "",
    endDate: "",
  });

  const selectedEvent = events.find(e => e.id === formData.eventId);

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setLoading(true);

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          eventId: formData.eventId,
          branchId: selectedEvent.branchId,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (response.ok) {
        onAssignmentCreated();
        setFormData({
          employeeId: "",
          eventId: "",
          startDate: "",
          endDate: "",
        });
      } else {
        const error = await response.json();
        console.error("Error creating assignment:", error);
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Assign a security employee to an event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event" className="text-right">
                Event
              </Label>
              <Select value={formData.eventId} onValueChange={(value) => handleInputChange("eventId", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex flex-col">
                        <span>{event.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {event.branchName} - {new Date(event.startTime).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <div className="col-span-4 p-3 bg-muted rounded-md">
                <div className="text-sm space-y-1">
                  <div><strong>Event:</strong> {selectedEvent.name}</div>
                  <div><strong>Client:</strong> {selectedEvent.clientName}</div>
                  <div><strong>Branch:</strong> {selectedEvent.branchName}</div>
                  <div><strong>Time:</strong> {new Date(selectedEvent.startTime).toLocaleString()} - {new Date(selectedEvent.endTime).toLocaleString()}</div>
                  {selectedEvent.description && (
                    <div><strong>Description:</strong> {selectedEvent.description}</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employee
              </Label>
              <Select value={formData.employeeId} onValueChange={(value) => handleInputChange("employeeId", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>{employee.name}</span>
                        <span className="text-xs text-muted-foreground">{employee.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.employeeId || !formData.eventId}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 