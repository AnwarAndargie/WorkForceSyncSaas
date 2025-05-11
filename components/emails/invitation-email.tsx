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

interface InvitationEmailProps {
  inviterName: string;
  organizationName: string;
  role: string;
  invitationLink: string;
  appName: string;
}

export function InvitationEmail({
  inviterName,
  organizationName,
  role,
  invitationLink,
  appName,
}: InvitationEmailProps) {
  // Format role name for display
  const formattedRole = role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return (
    <Html>
      <Head />
      <Container style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "600px" }}>
        <Heading style={{ color: "#1a202c", marginBottom: "16px" }}>
          You've Been Invited to Join {organizationName}
        </Heading>
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          Hello,
        </Text>
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong> on {appName} as a <strong>{formattedRole}</strong>.
        </Text>
        
        <Section style={{ 
          backgroundColor: "#f7fafc", 
          padding: "20px", 
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <Text style={{ fontSize: "16px", marginBottom: "12px" }}>
            Click the button below to accept this invitation and create your account.
          </Text>
          
          <Button
            href={invitationLink}
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
            Accept Invitation
          </Button>
        </Section>
        
        <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
        
        <Text style={{ color: "#4a5568", fontSize: "16px", marginBottom: "12px" }}>
          If you're having trouble with the button above, copy and paste the URL below into your web browser:
        </Text>
        
        <Text style={{ 
          fontSize: "14px", 
          color: "#3182ce", 
          marginBottom: "24px",
          wordBreak: "break-all"
        }}>
          {invitationLink}
        </Text>
        
        <Text style={{ color: "#718096", fontSize: "14px", marginTop: "32px" }}>
          This invitation will expire in 7 days. If you did not expect to receive an invitation to join {appName}, you can ignore this email.
        </Text>
      </Container>
    </Html>
  );
} 