"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { 
  Calendar, 
  CheckCircle2, 
  PlusCircle, 
  Clock, 
  AlertCircle,
  Filter, 
  Download,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Assignment } from "@/types/Assignment";
import { Badge } from "@/components/ui/badge";

// Create a context for authentication
const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  signIn: (username: string, password: string) => {},
  signUp: (username: string, password: string) => {}
});

// Custom hook to use the AuthContext
const useAuth = () => useContext(AuthContext);

// Mock authentication provider component
function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  const signIn = (username: string, password: string) => {
    // Mock sign-in logic
    console.log(`Signing in with username: ${username}, password: ${password}`);
    setIsAuthenticated(true);
  };

  const signUp = (username: string, password: string) => {
    // Mock sign-up logic
    console.log(`Signing up with username: ${username}, password: ${password}`);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protect the AssignmentsPage component
function ProtectedAssignmentsPage() {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl mb-4">Please log in to view the dashboard.</h2>
        <button onClick={login} className="bg-blue-500 text-white px-4 py-2 rounded">Log In</button>
      </div>
    );
  }

  return <AssignmentsPage />;
}

// Mock data for assignments
const mockAssignments: Assignment[] = [
  {
    id: 1,
    companyId: 1,
    employeeId: 101,
    branchId: 201,
    serviceId: 301,
    startDate: "2023-05-15",
    endDate: "2023-05-15",
    status: "completed",
    notes: "Regular weekly cleaning service",
    createdAt: "2023-05-10T10:00:00Z"
  },
  {
    id: 2,
    companyId: 1,
    employeeId: 102,
    branchId: 202,
    serviceId: 302,
    startDate: "2023-05-16",
    status: "active",
    notes: "24/7 security detail",
    createdAt: "2023-05-11T10:00:00Z"
  },
  {
    id: 3,
    companyId: 1,
    employeeId: 103,
    branchId: 203,
    serviceId: 303,
    startDate: "2023-05-20",
    status: "active",
    notes: "Monthly maintenance check",
    createdAt: "2023-05-12T10:00:00Z"
  },
  {
    id: 4,
    companyId: 1,
    employeeId: 104,
    branchId: 204,
    serviceId: 304,
    startDate: "2023-05-18",
    endDate: "2023-05-18",
    status: "completed",
    notes: "One-time deep cleaning",
    createdAt: "2023-05-13T10:00:00Z"
  },
  {
    id: 5,
    companyId: 1,
    employeeId: 105,
    branchId: 205,
    serviceId: 305,
    startDate: "2023-05-22",
    status: "active",
    notes: "IT system maintenance",
    createdAt: "2023-05-14T10:00:00Z"
  }
];

// Mock data for employee names
const employeeNames: Record<number, string> = {
  101: "John Smith",
  102: "Sarah Johnson",
  103: "Michael Brown",
  104: "Emily Davis",
  105: "Robert Wilson"
};

// Mock data for branch names
const branchNames: Record<number, string> = {
  201: "Downtown HQ",
  202: "Mall Office",
  203: "Industrial Park",
  204: "Business Center",
  205: "Tech Campus"
};

// Mock data for service names
const serviceNames: Record<number, string> = {
  301: "Regular Cleaning",
  302: "Security Guard",
  303: "Maintenance",
  304: "Deep Cleaning",
  305: "IT Support"
};

// Mock shifts data
const mockShifts = [
  { id: 1, assignmentId: 1, date: "2023-05-15", startTime: "09:00", endTime: "17:00", status: "completed" },
  { id: 2, assignmentId: 2, date: "2023-05-16", startTime: "00:00", endTime: "08:00", status: "completed" },
  { id: 3, assignmentId: 2, date: "2023-05-16", startTime: "08:00", endTime: "16:00", status: "in-progress" },
  { id: 4, assignmentId: 2, date: "2023-05-16", startTime: "16:00", endTime: "00:00", status: "scheduled" },
  { id: 5, assignmentId: 3, date: "2023-05-20", startTime: "10:00", endTime: "14:00", status: "scheduled" },
  { id: 6, assignmentId: 4, date: "2023-05-18", startTime: "08:00", endTime: "16:00", status: "completed" },
  { id: 7, assignmentId: 5, date: "2023-05-22", startTime: "13:00", endTime: "17:00", status: "scheduled" }
];

// Main App component
export default function App() {
  return (
    <AuthProvider>
      <ProtectedAssignmentsPage />
    </AuthProvider>
  );
}

function AssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  
  // Filter assignments based on search query and filters
  const filteredAssignments = mockAssignments.filter(assignment => {
    const matchesSearch = 
      employeeNames[assignment.employeeId].toLowerCase().includes(searchQuery.toLowerCase()) ||
      branchNames[assignment.branchId].toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceNames[assignment.serviceId].toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assignment.notes && assignment.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    const matchesService = serviceFilter === "all" || assignment.serviceId.toString() === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-gray-500">Manage your workforce assignments and shifts</p>
        </div>
        <Button className="bg-orange-400 hover:bg-orange-300">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filter Assignments</CardTitle>
              <CardDescription>
                Use the filters below to find specific assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by employee, branch or service"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="301">Regular Cleaning</SelectItem>
                      <SelectItem value="302">Security Guard</SelectItem>
                      <SelectItem value="303">Maintenance</SelectItem>
                      <SelectItem value="304">Deep Cleaning</SelectItem>
                      <SelectItem value="305">IT Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Assignments List</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.id}</TableCell>
                      <TableCell>{employeeNames[assignment.employeeId]}</TableCell>
                      <TableCell>{branchNames[assignment.branchId]}</TableCell>
                      <TableCell>{serviceNames[assignment.serviceId]}</TableCell>
                      <TableCell>{assignment.startDate}</TableCell>
                      <TableCell>{assignment.endDate || "Ongoing"}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            assignment.status === "active" 
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{assignment.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAssignments.length === 0 && (
                <div className="text-center p-6 text-gray-500">
                  No assignments match your filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Shifts Schedule</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockShifts.map((shift) => {
                    const assignment = mockAssignments.find(a => a.id === shift.assignmentId)!;
                    return (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.id}</TableCell>
                        <TableCell>{shift.assignmentId}</TableCell>
                        <TableCell>{employeeNames[assignment.employeeId]}</TableCell>
                        <TableCell>{branchNames[assignment.branchId]}</TableCell>
                        <TableCell>{shift.date}</TableCell>
                        <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {shift.status === "completed" && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {shift.status === "in-progress" && (
                              <Clock className="h-4 w-4 text-blue-500" />
                            )}
                            {shift.status === "scheduled" && (
                              <Calendar className="h-4 w-4 text-gray-500" />
                            )}
                            <Badge 
                              className={
                                shift.status === "completed" 
                                  ? "bg-green-100 text-green-800"
                                  : shift.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { useAuth }; 