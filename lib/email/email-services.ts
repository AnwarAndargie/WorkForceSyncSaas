import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "../../components/common/welcome-email";
import { db } from "../db/drizzle";
import { emailEvents } from "../db/schema";
import { SubscriptionConfirmationEmail } from "../../components/emails/subscription-confirmation-email";
import { PlanUpdateEmail } from "../../components/emails/plan-update-email";
import { InvitationEmail } from "../../components/emails/invitation-email";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@yoursaas.com";
const APP_NAME = process.env.APP_NAME || "SaaS Platform";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * Generic function to send emails with error handling and logging
 */
export async function sendEmail({
  to,
  subject,
  html,
  userId,
  emailType,
}: {
  to: string;
  subject: string;
  html: string;
  userId: string;
  emailType: string;
}) {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    // Log email event
    await db.insert(emailEvents).values({
      userId,
      emailType,
      sentAt: new Date(),
      failed: !response.data?.id,
      errorMessage: response.error ? response.error.message : null,
    });

    return { success: true, response };
  } catch (error) {
    console.error(`Failed to send ${emailType} email:`, error);
    
    // Log the failure
    await db.insert(emailEvents).values({
      userId,
      emailType,
      sentAt: new Date(),
      failed: true,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(user: {
  id: string;
  email: string;
  name: string;
}) {
  try {
    const dashboardUrl = `${BASE_URL}/dashboard`;
    // Convert React component to HTML string
    const emailHtml = render(
      WelcomeEmail({ userName: user.name, dashboardUrl })
    ).toString();

    return await sendEmail({
      to: user.email,
      subject: `Welcome to ${APP_NAME}!`,
      html: emailHtml,
      userId: user.id,
      emailType: "welcome",
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}

export async function sendSubscriptionConfirmationEmail(user: {
  id: string;
  email: string;
  name: string;
}, plan: {
  name: string;
  price: number;
  currency: string;
}) {
  try {
    const billingUrl = `${BASE_URL}/dashboard/settings/billing`;
    // Convert React component to HTML string
    const emailHtml = render(
      SubscriptionConfirmationEmail({
        userName: user.name,
        planName: plan.name,
        planPrice: plan.price,
        planCurrency: plan.currency,
        billingUrl,
        appName: APP_NAME,
      })
    ).toString();

    return await sendEmail({
      to: user.email,
      subject: `Your ${APP_NAME} Subscription Confirmation`,
      html: emailHtml,
      userId: user.id,
      emailType: "subscription_confirmation",
    });
  } catch (error) {
    console.error("Failed to send subscription confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendPlanUpdateEmail(user: {
  id: string;
  email: string;
  name: string;
}, oldPlan: {
  name: string;
}, newPlan: {
  name: string;
  price: number;
  currency: string;
}) {
  try {
    const billingUrl = `${BASE_URL}/dashboard/settings/billing`;
    // Convert React component to HTML string
    const emailHtml = render(
      PlanUpdateEmail({
        userName: user.name,
        oldPlanName: oldPlan.name,
        newPlanName: newPlan.name,
        newPlanPrice: newPlan.price,
        newPlanCurrency: newPlan.currency,
        billingUrl,
        appName: APP_NAME,
      })
    ).toString();

    return await sendEmail({
      to: user.email,
      subject: `Your ${APP_NAME} Plan Has Been Updated`,
      html: emailHtml,
      userId: user.id,
      emailType: "plan_update",
    });
  } catch (error) {
    console.error("Failed to send plan update email:", error);
    return { success: false, error };
  }
}

export async function sendInvitationEmail(invitation: {
  id: string;
  invitedUserEmail: string;
  organizationId: string;
  role: string;
}, inviter: {
  id: string;
  name: string;
}, organization: {
  name: string;
}) {
  try {
    const invitationLink = `${BASE_URL}/invitation/${invitation.id}`;
    // Convert React component to HTML string
    const emailHtml = render(
      InvitationEmail({
        inviterName: inviter.name,
        organizationName: organization.name,
        role: invitation.role,
        invitationLink,
        appName: APP_NAME,
      })
    ).toString();

    return await sendEmail({
      to: invitation.invitedUserEmail,
      subject: `Invitation to Join ${organization.name} on ${APP_NAME}`,
      html: emailHtml,
      userId: inviter.id,
      emailType: "invitation",
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error };
  }
}

export async function sendQuizGuideEmail(user: {
  id: string;
  email: string;
  name: string;
}) {
  console.log("Sending quiz guide email to", user.email);
}
