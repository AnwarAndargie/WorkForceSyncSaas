import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
}

export function WelcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Container style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <Heading style={{ color: "#1a202c" }}>
          Welcome to TeamSync, {userName}!
        </Heading>
        <Text style={{ color: "#4a5568", fontSize: "16px" }}>
          Thank you for joining TeamSync! Our platform helps you manage teams,
          create quizzes, assign tasks, and drive growth with analytics.
        </Text>
        <Button
          href={dashboardUrl}
          style={{
            backgroundColor: "#f97316",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "9999px",
            display: "inline-block",
            marginTop: "20px",
          }}
        >
          Explore Your Dashboard
        </Button>
      </Container>
    </Html>
  );
}
