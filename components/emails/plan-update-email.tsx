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

interface PlanUpdateEmailProps {
  userName: string;
  oldPlanName: string;
  newPlanName: string;
  newPlanPrice: number;
  newPlanCurrency: string;
  billingUrl: string;
  appName: string;
}

export function PlanUpdateEmail({
  userName,
  oldPlanName,
  newPlanName,
  newPlanPrice,
  newPlanCurrency,
  billingUrl,
  appName,
}: PlanUpdateEmailProps) {
  // Format currency display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: newPlanCurrency.toUpperCase(),
  }).format(newPlanPrice / 100); // Assuming price is in cents

  return (
    <Html>
      <Head />
      <Container style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "600px" }}>
        <Heading style={{ color: "#1a202c", marginBottom: "16px" }}>
          Your Subscription Has Been Updated
        </Heading>
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          Hi {userName},
        </Text>
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          Your subscription to {appName} has been updated from <strong>{oldPlanName}</strong> to <strong>{newPlanName}</strong>.
        </Text>
        
        <Section style={{ 
          backgroundColor: "#f7fafc", 
          padding: "20px", 
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
            New Subscription Details:
          </Text>
          <Text style={{ marginBottom: "8px" }}>
            <strong>Plan:</strong> {newPlanName}
          </Text>
          <Text style={{ marginBottom: "8px" }}>
            <strong>Price:</strong> {formattedPrice}
          </Text>
        </Section>
        
        <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "24px" }}>
          The change in your subscription is effective immediately. If you have any questions about your updated plan or billing, please visit your account settings.
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
          View Billing Details
        </Button>
        
        <Text style={{ color: "#718096", fontSize: "14px", marginTop: "32px" }}>
          If you did not authorize this change or have any concerns, please contact our support team immediately.
        </Text>
        
        <Text style={{ color: "#718096", fontSize: "14px", marginTop: "16px" }}>
          Thank you for your continued support of {appName}!
        </Text>
      </Container>
    </Html>
  );
} 