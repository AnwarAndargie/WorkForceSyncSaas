"use server";

import { redirect } from "next/navigation";
import { createCheckoutSession, createCustomerPortalSession } from "./stripe";
import { withTeam } from "@/lib/auth/middleware";

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get("priceId") as string;
  await createCheckoutSession({ org: team, priceId });
});

export const customerPortalAction = withTeam(async (_, org) => {
  const portalSession = await createCustomerPortalSession(org);
  redirect(portalSession.url);
});
