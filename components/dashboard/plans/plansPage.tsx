"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  billingCycle: "monthly" | "yearly";
  isActive: boolean;
  createdAt: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription-plans", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.data || []);
      } else {
        console.log("failed to fetch errors");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setPlans(plans.filter((plan) => plan.id !== planId));
      } else {
        throw new Error("Failed to delete plan");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-gray-600">
            Manage global subscription plans for all tenants
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => router.push("/dashboard/plans/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge
                    variant={
                      plan.billingCycle === "monthly" ? "default" : "secondary"
                    }
                    className="mt-2"
                  >
                    {plan.billingCycle}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push(`/dashboard/plans/${plan.id}/edit`);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePlan(plan.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {plan.price}ETB
                    <span className="text-sm font-normal text-gray-500">
                      /{plan.billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No plans found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first subscription plan.
          </p>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => router.push("/dashboard/plans/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      )}
    </div>
  );
}
