"use client";

import { useState } from "react";
import { 
  PlusCircle, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  MapPin,
  Building,
  Phone,
  Mail,
  Calendar,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Client } from "@/types/Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Mock data for clients
const mockClients: Client[] = [
  {
    id: 1,
    companyId: 1,
    name: "ABC Corporation",
    email: "contact@abccorp.com",
    phone: "555-123-4567",
    address: "123 Main St, Business District, City",
    createdAt: "2022-01-15T10:00:00Z"
  },
  {
    id: 2,
    companyId: 1,
    name: "XYZ Industries",
    email: "info@xyzindustries.com",
    phone: "555-987-6543",
    address: "456 Tech Lane, Innovation Park, City",
    createdAt: "2022-02-20T10:00:00Z"
  },
  {
    id: 3,
    companyId: 1,
    name: "Global Tech Services",
    email: "support@globaltech.com",
    phone: "555-456-7890",
    address: "789 Digital Blvd, Tech Hub, City",
    createdAt: "2022-03-10T10:00:00Z"
  },
  {
    id: 4,
    companyId: 1,
    name: "Metro Office Solutions",
    email: "hello@metrooffice.com",
    phone: "555-789-0123",
    address: "321 Corporate Way, Downtown, City",
    createdAt: "2022-04-05T10:00:00Z"
  },
  {
    id: 5,
    companyId: 1,
    name: "First Bank Headquarters",
    email: "operations@firstbank.com",
    phone: "555-321-6547",
    address: "987 Financial St, Business Center, City",
    createdAt: "2022-05-12T10:00:00Z"
  }
];

// Mock data for branches
const mockBranches = [
  { id: 1, clientId: 1, name: "Main Office", location: "123 Main St, Floor 10, City" },
  { id: 2, clientId: 1, name: "Manufacturing Plant", location: "456 Industry Rd, City" },
  { id: 3, clientId: 2, name: "Headquarters", location: "789 Tech Lane, City" },
  { id: 4, clientId: 3, name: "Downtown Branch", location: "101 City Center, City" },
  { id: 5, clientId: 3, name: "Airport Office", location: "Airport Terminal 2, City" },
  { id: 6, clientId: 4, name: "Main Branch", location: "321 Corporate Way, Floor 5, City" },
  { id: 7, clientId: 5, name: "Main Building", location: "987 Financial St, City" },
  { id: 8, clientId: 5, name: "Remote Office", location: "654 Remote Rd, Suburb" }
];

// Mock data for contracts
const mockContracts = [
  { 
    id: 1, 
    clientId: 1, 
    name: "Regular Cleaning Services", 
    startDate: "2023-01-01", 
    endDate: "2023-12-31", 
    value: 48000,
    status: "active"
  },
  { 
    id: 2, 
    clientId: 2, 
    name: "24/7 Security Coverage", 
    startDate: "2023-02-01", 
    endDate: "2024-01-31", 
    value: 120000,
    status: "active"
  },
  { 
    id: 3, 
    clientId: 3, 
    name: "IT Support Services", 
    startDate: "2023-03-01", 
    endDate: "2023-06-30", 
    value: 24000,
    status: "expired"
  },
  { 
    id: 4, 
    clientId: 3, 
    name: "Maintenance Services", 
    startDate: "2023-07-01", 
    endDate: "2023-12-31", 
    value: 35000,
    status: "active"
  },
  { 
    id: 5, 
    clientId: 4, 
    name: "Cleaning and Maintenance", 
    startDate: "2023-04-01", 
    endDate: "2024-03-31", 
    value: 72000,
    status: "active"
  },
  { 
    id: 6, 
    clientId: 5, 
    name: "Security Services", 
    startDate: "2023-05-01", 
    endDate: "2024-04-30", 
    value: 96000,
    status: "active"
  }
];

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientBranches = (clientId: number) => {
    return mockBranches.filter(branch => branch.clientId === clientId);
  };

  const getClientContracts = (clientId: number) => {
    return mockContracts.filter(contract => contract.clientId === clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-500">Manage your client relationships and services</p>
        </div>
        <Button 
          className="bg-orange-400 hover:bg-orange-300" 
          onClick={() => setIsAddClientOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle>Client Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{client.address}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getClientBranches(client.id).length}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        getClientContracts(client.id).some(c => c.status === "active") 
                          ? "border-green-200 text-green-800 bg-green-50"
                          : "border-red-200 text-red-800 bg-red-50"
                      }
                    >
                      {getClientContracts(client.id).filter(c => c.status === "active").length} Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setSelectedClient(client)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Building className="mr-2 h-4 w-4" />
                          Manage Branches
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Contracts
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredClients.length === 0 && (
            <div className="text-center p-6 text-gray-500">
              No clients found matching your search
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Client Details</TabsTrigger>
            <TabsTrigger value="branches">Branches ({getClientBranches(selectedClient.id).length})</TabsTrigger>
            <TabsTrigger value="contracts">Contracts ({getClientContracts(selectedClient.id).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedClient.name}</CardTitle>
                <CardDescription>Client information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Phone:</span>
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <span className="font-medium">Address:</span>
                      <span>{selectedClient.address}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Client Since</h3>
                      <p>{new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Total Active Contracts</h3>
                      <p>{getClientContracts(selectedClient.id).filter(c => c.status === "active").length}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Total Contract Value</h3>
                      <p>${getClientContracts(selectedClient.id)
                        .reduce((sum, contract) => sum + contract.value, 0)
                        .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="branches" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Client Branches</CardTitle>
                  <CardDescription>
                    All locations for {selectedClient.name}
                  </CardDescription>
                </div>
                <Button size="sm" className="bg-orange-400 hover:bg-orange-300">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Branch
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getClientBranches(selectedClient.id).map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>{branch.id}</TableCell>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>{branch.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Client Contracts</CardTitle>
                  <CardDescription>
                    Service agreements with {selectedClient.name}
                  </CardDescription>
                </div>
                <Button size="sm" className="bg-orange-400 hover:bg-orange-300">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Contract
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Contract Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getClientContracts(selectedClient.id).map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{contract.id}</TableCell>
                        <TableCell className="font-medium">{contract.name}</TableCell>
                        <TableCell>{contract.startDate}</TableCell>
                        <TableCell>{contract.endDate}</TableCell>
                        <TableCell>${contract.value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            contract.status === "active" 
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details for your new client. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" placeholder="Company name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" placeholder="contact@company.com" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" placeholder="555-123-4567" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input id="address" placeholder="123 Business St, City" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-400 hover:bg-orange-300" onClick={() => setIsAddClientOpen(false)}>
              Save Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 