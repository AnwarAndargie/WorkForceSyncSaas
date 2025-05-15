"use client";

import { useState } from "react";
import { 
  PlusCircle,
  Search,
  FilterX,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  price?: number;
  category: string;
  createdAt: string;
}

// Mock service categories
const serviceCategories = [
  "Cleaning",
  "Security",
  "Maintenance",
  "IT Support",
  "Logistics"
];

// Mock data for services
const mockServices: Service[] = [
  {
    id: 1,
    companyId: 1,
    name: "Regular Office Cleaning",
    description: "Standard weekly cleaning service for office spaces including vacuuming, dusting, and surface sanitization.",
    price: 75,
    category: "Cleaning",
    createdAt: "2023-01-10T10:00:00Z"
  },
  {
    id: 2,
    companyId: 1,
    name: "Deep Cleaning",
    description: "Thorough cleaning service including carpet cleaning, window washing, and detailed sanitization of all surfaces.",
    price: 150,
    category: "Cleaning",
    createdAt: "2023-01-15T10:00:00Z"
  },
  {
    id: 3,
    companyId: 1,
    name: "24/7 Security Guard",
    description: "Round-the-clock security personnel stationed at client premises.",
    price: 35,
    category: "Security",
    createdAt: "2023-02-05T10:00:00Z"
  },
  {
    id: 4,
    companyId: 1,
    name: "CCTV Monitoring",
    description: "Remote monitoring of security camera feeds with incident reporting.",
    price: 50,
    category: "Security",
    createdAt: "2023-02-10T10:00:00Z"
  },
  {
    id: 5,
    companyId: 1,
    name: "Preventive Maintenance",
    description: "Regular check-ups and maintenance of building systems and equipment.",
    price: 120,
    category: "Maintenance",
    createdAt: "2023-03-05T10:00:00Z"
  },
  {
    id: 6,
    companyId: 1,
    name: "Emergency Repairs",
    description: "Rapid response service for urgent maintenance issues.",
    price: 200,
    category: "Maintenance",
    createdAt: "2023-03-20T10:00:00Z"
  },
  {
    id: 7,
    companyId: 1,
    name: "Network Support",
    description: "Troubleshooting and maintenance of client network infrastructure.",
    price: 95,
    category: "IT Support",
    createdAt: "2023-04-15T10:00:00Z"
  },
  {
    id: 8,
    companyId: 1,
    name: "Package Delivery",
    description: "Scheduled delivery service for documents and small packages.",
    price: 25,
    category: "Logistics",
    createdAt: "2023-05-10T10:00:00Z"
  }
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Filter services based on search query and category
  const filteredServices = mockServices.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !categoryFilter || service.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsAddServiceOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage your service offerings and pricing
          </p>
        </div>
        <Button onClick={() => {
          setEditingService(null);
          setIsAddServiceOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map(category => (
              <Badge
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          {categoryFilter && (
            <Button size="sm" variant="ghost" onClick={() => setCategoryFilter(null)}>
              <FilterX className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Service Directory</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Tag className="mr-1 h-3 w-3" />
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{service.description}</TableCell>
                  <TableCell className="text-right">${service.price?.toFixed(2)}/hr</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditService(service)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No services found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredServices.length}</strong> of <strong>{mockServices.length}</strong> services
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update the service details below." : "Fill in the details for your new service."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input 
                id="name" 
                placeholder="Service name" 
                className="col-span-3"
                defaultValue={editingService?.name}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input 
                id="category" 
                placeholder="e.g. Cleaning, Security" 
                className="col-span-3"
                defaultValue={editingService?.category}
                list="categories"
              />
              <datalist id="categories">
                {serviceCategories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price ($/hr)
              </Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="0.00" 
                className="col-span-3"
                defaultValue={editingService?.price}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea 
                id="description" 
                placeholder="Describe the service details" 
                className="col-span-3 min-h-[100px]"
                defaultValue={editingService?.description}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddServiceOpen(false)}>
              {editingService ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 