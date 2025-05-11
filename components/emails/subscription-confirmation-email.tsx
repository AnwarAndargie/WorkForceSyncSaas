import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface SubscriptionConfirmationEmailProps {
  userName: string;
  planName: string;
  planPrice: number;
  planCurrency: string;
  billingUrl: string;
  appName: string;
}

export function SubscriptionConfirmationEmail({
  userName,
  planName,
  planPrice,
  planCurrency,
  billingUrl,
  appName,
}: SubscriptionConfirmationEmailProps) {
  // Format currency display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: planCurrency.toUpperCase(),
  }).format(planPrice / 100); // Assuming price is in cents

  return (
    <Html>
      <Head />
      <Container style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "600px" }}>
        <Heading style={{ color: "#1a202c", marginBottom: "16px" }}>
          Subscription Confirmed!
        </Heading>
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          Hi {userName},
        </Text>
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          Thank you for subscribing to {appName}. Your subscription has been confirmed and your account has been updated.
        </Text>
        
        <Section style={{ 
          backgroundColor: "#f7fafc", 
          padding: "20px", 
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
            Subscription Details:
          </Text>
          <Text style={{ marginBottom: "8px" }}>
            <strong>Plan:</strong> {planName}
          </Text>
          <Text style={{ marginBottom: "8px" }}>
            <strong>Price:</strong> {formattedPrice}
          </Text>
        </Section>
        
        <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "24px" }}>
          You can manage your subscription settings at any time through your account dashboard.
        </Text>
        
        <Button
          href={billingUrl}
          style={{
            backgroundColor: "#f97316",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Manage Subscription
        </Button>
        
        <Text style={{ color: "#718096", fontSize: "14px", marginTop: "32px" }}>
          If you have any questions or concerns about your subscription, please don't hesitate to contact our support team.
        </Text>
        
        <Text style={{ color: "#718096", fontSize: "14px", marginTop: "16px" }}>
          Thank you for choosing {appName}!
        </Text>
      </Container>
    </Html>
  );
} 