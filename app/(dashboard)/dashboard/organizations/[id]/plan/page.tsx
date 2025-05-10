"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  stripePriceId: string;
  features: string[];
  isActive: boolean;
}

interface Organization {
  id: string;
  name: string;
  planId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionCurrentPeriodEnd: number | null;
}

export default function OrganizationPlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organization
        const orgRes = await fetch(`/api/organization/${id}`);
        if (!orgRes.ok) throw new Error("Failed to fetch organization");
        const orgData = await orgRes.json();
        setOrganization(orgData);
        
        // Fetch available plans
        const plansRes = await fetch('/api/plans');
        if (!plansRes.ok) throw new Error("Failed to fetch plans");
        const plansData = await plansRes.json();
        setAvailablePlans(plansData.filter((plan: Plan) => plan.isActive));
        
        // Find current plan
        if (orgData.planId) {
          const current = plansData.find((plan: Plan) => plan.id === orgData.planId);
          setCurrentPlan(current || null);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdatePlan = async (planId: string) => {
    if (!organization) return;
    
    setUpdatingPlan(true);
    setUpdatingPlanId(planId);
    
    try {
      const res = await fetch(`/api/organization/${id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) throw new Error("Failed to update plan");
      
      const updatedOrg = await res.json();
      setOrganization(updatedOrg);
      
      // Update current plan
      const newPlan = availablePlans.find(plan => plan.id === planId);
      setCurrentPlan(newPlan || null);
      
      toast.success("Plan updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update plan");
    } finally {
      setUpdatingPlan(false);
      setUpdatingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg mb-4">Organization not found</p>
        <Button 
          onClick={() => router.push("/dashboard/organizations")}
          className="bg-orange-400 text-white hover:bg-orange-300"
        >
          Back to Organizations
        </Button>
      </div>
    );
  }

  const formatCurrency = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
    }).format(price);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{organization.name} - Subscription</h1>
          <p className="text-muted-foreground">Manage the organization's subscription plan</p>
          {currentPlan && (
            <div className="mt-2">
              <Badge className="bg-orange-400">Current Plan: {currentPlan.name}</Badge>
              {organization.stripeSubscriptionStatus && (
                <Badge className="ml-2 bg-gray-500">
                  Status: {organization.stripeSubscriptionStatus}
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button 
          onClick={() => router.push(`/dashboard/organizations/${id}`)}
          variant="outline"
        >
          Organization Details
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.id === organization.planId ? 'border-orange-400 border-2' : ''}`}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2 text-2xl font-bold">
                {formatCurrency(plan.price, plan.currency)}<span className="text-sm font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              {plan.features && plan.features.length > 0 ? (
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-orange-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No features specified</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${plan.id === organization.planId ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-gray-700' : 'bg-orange-400 hover:bg-orange-300 text-white'}`}
                onClick={() => handleUpdatePlan(plan.id)}
                disabled={plan.id === organization.planId || updatingPlan}
              >
                {updatingPlan && updatingPlanId === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : plan.id === organization.planId ? (
                  "Current Plan"
                ) : (
                  "Select Plan"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 