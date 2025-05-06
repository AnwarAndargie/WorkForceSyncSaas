"use client";

import {
  CircleIcon,
  Check,
  Pencil,
  Trash,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    interval: "month",
    trialDays: "7",
    features: "",
  });
  const router = useRouter();

  // Check super admin role
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const res = await fetch("/api/auth/user");
  //       if (!res.ok) throw new Error("Failed to fetch user");
  //       const user = await res.json();
  //       if (user.role !== "super_admin") {
  //         router.push("/dashboard");
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       router.push("/dashboard");
  //     }
  //   };
  //   checkAuth();
  // }, [router]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) throw new Error("Failed to fetch plans");
        const data = await res.json();
        setPlans(
          data.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            interval: plan.interval || "month",
            trialDays: plan.trialDays || 7,
            features: plan.description
              ? plan.description.split(", ")
              : plan.features || [],
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleCreate = async () => {
    if (!newPlan.name || !newPlan.price || !newPlan.features) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlan.name,
          price: parseInt(newPlan.price),
          interval: newPlan.interval,
          trialDays: parseInt(newPlan.trialDays),
          features: newPlan.features.split(",").map((f) => f.trim()),
          description: newPlan.features, // For schema compatibility
        }),
      });

      if (!res.ok) throw new Error("Failed to create plan");
      const createdPlan = await res.json();
      setPlans((prev) => [
        ...prev,
        {
          ...createdPlan,
          features: createdPlan.description
            ? createdPlan.description.split(", ")
            : createdPlan.features,
        },
      ]);
      setNewPlan({
        name: "",
        price: "",
        interval: "month",
        trialDays: "7",
        features: "",
      });
      toast.success("Plan created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error creating plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (
      !editPlan ||
      !editPlan.name ||
      !editPlan.price ||
      !editPlan.features.length
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsEditSubmitting(true);
    try {
      const res = await fetch(`/api/plans/${editPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPlan.name,
          price: editPlan.price,
          interval: editPlan.interval,
          trialDays: editPlan.trialDays,
          features: editPlan.features,
          description: editPlan.features.join(", "), // For schema compatibility
        }),
      });

      if (!res.ok) throw new Error("Failed to update plan");
      const updatedPlan = await res.json();
      setPlans((prev) =>
        prev.map((p) =>
          p.id === updatedPlan.id
            ? {
                ...updatedPlan,
                features: updatedPlan.description
                  ? updatedPlan.description.split(", ")
                  : updatedPlan.features,
              }
            : p
        )
      );
      setEditPlan(null);
      toast.success("Plan updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating plan");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete plan");
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
      toast.success("Plan deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting plan");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-8">
          <CircleIcon className="h-16 w-16 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600" />
        </div>
        <h1 className="text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
          Manage Subscription Plans
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Create, edit, and manage subscription plans for your platform with
          ease. (Super Admin Only)
        </p>

        {/* Add Plan Button */}
        <div className="mb-8 flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-white/80 backdrop-blur-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Create New Plan
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Plan Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g., Pro Plan"
                    value={newPlan.name}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, name: e.target.value })
                    }
                    className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price (in cents)
                  </label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 1000 for $10"
                    value={newPlan.price}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, price: e.target.value })
                    }
                    className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="interval"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Billing Interval
                  </label>
                  <Input
                    id="interval"
                    placeholder="e.g., month"
                    value={newPlan.interval}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, interval: e.target.value })
                    }
                    className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="trialDays"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Trial Days
                  </label>
                  <Input
                    id="trialDays"
                    type="number"
                    placeholder="e.g., 7"
                    value={newPlan.trialDays}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, trialDays: e.target.value })
                    }
                    className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="features"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Features (comma-separated)
                  </label>
                  <Textarea
                    id="features"
                    placeholder="e.g., Unlimited Users, Advanced Analytics"
                    value={newPlan.features}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, features: e.target.value })
                    }
                    className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() =>
                    setNewPlan({
                      name: "",
                      price: "",
                      interval: "month",
                      trialDays: "7",
                      features: "",
                    })
                  }
                >
                  Reset
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl shadow-md transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Plan"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
              <CircleIcon className="mx-auto h-16 w-16 text-orange-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                No Plans Available
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first subscription plan to offer
                your users.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl shadow-md transition-all hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-white/80 backdrop-blur-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      Create New Plan
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Plan Name
                      </label>
                      <Input
                        id="name"
                        placeholder="e.g., Pro Plan"
                        value={newPlan.name}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, name: e.target.value })
                        }
                        className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Price (in cents)
                      </label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="e.g., 1000 for $10"
                        value={newPlan.price}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, price: e.target.value })
                        }
                        className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="interval"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Billing Interval
                      </label>
                      <Input
                        id="interval"
                        placeholder="e.g., month"
                        value={newPlan.interval}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, interval: e.target.value })
                        }
                        className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="trialDays"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Trial Days
                      </label>
                      <Input
                        id="trialDays"
                        type="number"
                        placeholder="e.g., 7"
                        value={newPlan.trialDays}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, trialDays: e.target.value })
                        }
                        className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="features"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Features (comma-separated)
                      </label>
                      <Textarea
                        id="features"
                        placeholder="e.g., Unlimited Users, Advanced Analytics"
                        value={newPlan.features}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, features: e.target.value })
                        }
                        className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() =>
                        setNewPlan({
                          name: "",
                          price: "",
                          interval: "month",
                          trialDays: "7",
                          features: "",
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl shadow-md transition-all"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Plan"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-100 transition-all hover:scale-105 hover:shadow-xl"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {plan.trialDays}-day free trial
                </p>
                <p className="text-4xl font-bold text-gray-900 mb-6">
                  ${(plan.price / 100).toFixed(2)}
                  <span className="text-xl font-normal text-gray-500">
                    {" "}
                    / user / {plan.interval}
                  </span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-orange-500 hover:text-orange-600 transition-colors">
                        <Pencil className="h-5 w-5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg bg-white/80 backdrop-blur-md rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                          Edit Plan
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div>
                          <label
                            htmlFor="edit-name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Plan Name
                          </label>
                          <Input
                            id="edit-name"
                            placeholder="e.g., Pro Plan"
                            value={editPlan?.name || ""}
                            onChange={(e) =>
                              setEditPlan((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="edit-price"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Price (in cents)
                          </label>
                          <Input
                            id="edit-price"
                            type="number"
                            placeholder="e.g., 1000 for $10"
                            value={editPlan?.price || ""}
                            onChange={(e) =>
                              setEditPlan((prev) =>
                                prev
                                  ? { ...prev, price: parseInt(e.target.value) }
                                  : null
                              )
                            }
                            className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="edit-interval"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Billing Interval
                          </label>
                          <Input
                            id="edit-interval"
                            placeholder="e.g., month"
                            value={editPlan?.interval || ""}
                            onChange={(e) =>
                              setEditPlan((prev) =>
                                prev
                                  ? { ...prev, interval: e.target.value }
                                  : null
                              )
                            }
                            className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="edit-trialDays"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Trial Days
                          </label>
                          <Input
                            id="edit-trialDays"
                            type="number"
                            placeholder="e.g., 7"
                            value={editPlan?.trialDays || ""}
                            onChange={(e) =>
                              setEditPlan((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      trialDays: parseInt(e.target.value),
                                    }
                                  : null
                              )
                            }
                            className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="edit-features"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Features (comma-separated)
                          </label>
                          <Textarea
                            id="edit-features"
                            placeholder="e.g., Unlimited Users, Advanced Analytics"
                            value={editPlan?.features.join(", ") || ""}
                            onChange={(e) =>
                              setEditPlan((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      features: e.target.value
                                        .split(",")
                                        .map((f) => f.trim()),
                                    }
                                  : null
                              )
                            }
                            className="rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-4">
                        <Button
                          variant="outline"
                          className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                          onClick={() => setEditPlan(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleEdit}
                          disabled={isEditSubmitting}
                          className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl shadow-md transition-all"
                        >
                          {isEditSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Update Plan"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button
                    className="text-red-500 hover:text-red-600 transition-colors"
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletingId === plan.id}
                  >
                    {deletingId === plan.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
