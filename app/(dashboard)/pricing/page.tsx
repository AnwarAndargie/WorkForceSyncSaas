import { checkoutAction } from "@/lib/payments/actions";
import { Check, CircleIcon } from "lucide-react";
import { getStripePrices, getStripeProducts } from "@/lib/payments/stripe";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === "Base");
  const plusPlan = products.find((product) => product.name === "Plus");
  const premiumPlan = products.find((product) => product.name === "Premium");

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);
  const premiumPrice = prices.find(
    (price) => price.productId === premiumPlan?.id
  );

  return (
    <main className="min-h-[100dvh] bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          Unlock the full potential of your team with our flexible plans
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <PricingCard
            name={basePlan?.name || "Base"}
            price={basePrice?.unitAmount || 800}
            interval={basePrice?.interval || "month"}
            trialDays={basePrice?.trialPeriodDays || 7}
            features={[
              "Unlimited Team Members",
              "Unlimited Quiz Creation",
              "Basic Analytics",
              "Email Support",
            ]}
            priceId={basePrice?.id}
          />
          <PricingCard
            name={plusPlan?.name || "Plus"}
            price={plusPrice?.unitAmount || 1200}
            interval={plusPrice?.interval || "month"}
            trialDays={plusPrice?.trialPeriodDays || 7}
            features={[
              "Everything in Base",
              "Priority Support",
              "Early Access to Quiz Templates",
              "Enhanced Analytics",
            ]}
            priceId={plusPrice?.id}
            highlighted={true}
          />
          <PricingCard
            name={premiumPlan?.name || "Premium"}
            price={premiumPrice?.unitAmount || 2400}
            interval={premiumPrice?.interval || "month"}
            trialDays={premiumPrice?.trialPeriodDays || 7}
            features={[
              "Everything in Plus",
              "Dedicated Account Manager",
              "Advanced Team Analytics",
              "Custom API Integrations",
            ]}
            priceId={premiumPrice?.id}
          />
        </div>
      </div>
    </main>
  );
}
function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  highlighted = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg p-6 ${
        highlighted ? "border-2 border-orange-500" : "border border-gray-200"
      }`}
    >
      {highlighted && (
        <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {trialDays}-day free trial included
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${(price / 100).toFixed(2)}
        <span className="text-xl font-normal text-gray-600">
          {" "}
          / user / {interval}
        </span>
      </p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton highlighted={highlighted} />
      </form>
    </div>
  );
}

