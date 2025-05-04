import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "../../components/common/welcome-email";
import { db } from "../db/drizzle";
import { emailEvents } from "../db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(user: {
  id: string;
  email: string;
  name: string;
}) {
  try {
    const dashboardUrl = `${process.env.BASE_URL}/dashboard`;
    const emailHtml = await render(
      WelcomeEmail({ userName: user.name, dashboardUrl })
    );

    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "anwarandargie3360@gmail.com",
      subject: "Welcome to TeamSync!",
      html: emailHtml,
    });

    // Log email event
    await db.insert(emailEvents).values({
      userId: user.id,
      emailType: "welcome",
      sentAt: new Date(),
      failed: !response.data?.id,
      errorMessage: response.error ? response.error.message : null,
    });

    return { success: true, response };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    await db.insert(emailEvents).values({
      userId: user.id,
      emailType: "welcome",
      sentAt: new Date(),
      failed: true,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
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
