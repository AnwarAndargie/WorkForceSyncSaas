"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plan } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PlanFormProps {
  plan?: Plan;
}

export function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    price: plan?.price ? plan.price.toString() : "",
    description: plan?.description || "",
    billingCycle: plan?.billingCycle || "monthly",
    isActive: plan?.isActive !== null ? plan?.isActive : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestData = {
        name: formData.name,
        price: parseInt(formData.price),
        description: formData.description,
        billingCycle: formData.billingCycle,
        isActive: formData.isActive,
      };

      const url = plan
        ? `/api/subscription-plans/${plan.id}`
        : "/api/subscription-plans";
      const method = plan ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      console.log(requestData);

      if (!response.ok) {
        throw new Error("Failed to save plan");
      }

      toast.success(
        plan ? "Plan updated successfully" : "Plan created successfully"
      );
      router.push("/dashboard/plans");
      router.refresh();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{plan ? "Edit Plan" : "Create New Plan"}</CardTitle>
          <CardDescription>
            {plan
              ? "Update the details of this subscription plan"
              : "Add a new subscription plan to your platform"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Pro Plan"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (in birr)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              placeholder="1000"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-gray-500">
              Enter the price in cents, e.g., 1000 for $10.00
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A description of the plan"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billling cycle">Billing Cycle</Label>
            <Textarea
              id="billing clycle"
              name="billing cycle"
              placeholder="Billing cycle of the plan"
              value={formData.billingCycle}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
              className="text-orange-600"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/plans")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {plan ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{plan ? "Update Plan" : "Create Plan"}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
