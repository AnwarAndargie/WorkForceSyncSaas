"use client";

import { CircleIcon, Check, Pencil, Trash } from "lucide-react";

const mockPlans = [
  {
    id: "plan_1",
    name: "Base",
    price: 1000,
    interval: "month",
    trialDays: 7,
    features: [
      "Unlimited Team Members",
      "Unlimited Quiz Creation",
      "Basic Analytics",
      "Email Support",
    ],
  },
  {
    id: "plan_2",
    name: "Plus",
    price: 1500,
    interval: "month",
    trialDays: 7,
    features: [
      "Everything in Base",
      "Priority Support",
      "Early Access to Quiz Templates",
      "Enhanced Analytics",
    ],
  },
  {
    id: "plan_3",
    name: "Premium",
    price: 2400,
    interval: "month",
    trialDays: 7,
    features: [
      "Everything in Plus",
      "Dedicated Account Manager",
      "Advanced Team Analytics",
      "Custom API Integrations",
    ],
  },
];

export default function PlansPage() {
  return (
    <main className="min-h-[100dvh] bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-6">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-4">
          Manage Subscription Plans
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          View and manage subscription plans for your platform
        </p>

        <div className="mb-8 flex justify-end">
          <button
            className="px-4 py-2 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
            onClick={() => alert("Add Plan functionality not implemented")}
          >
            Add New Plan
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {mockPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-2xl font-medium text-gray-900 mb-2">
                {plan.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {plan.trialDays}-day free trial
              </p>
              <p className="text-4xl font-medium text-gray-900 mb-6">
                ${(plan.price / 100).toFixed(2)}
                <span className="text-xl font-normal text-gray-600">
                  {" "}
                  / user / {plan.interval}
                </span>
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end gap-4">
                <button
                  className="text-orange-600 hover:text-orange-900 cursor-pointer"
                  onClick={() => alert("Edit functionality not implemented")}
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  className="text-red-600 hover:text-red-900 cursor-pointer"
                  onClick={() => alert("Delete functionality not implemented")}
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
