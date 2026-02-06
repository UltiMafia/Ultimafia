import React, { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Typography, Link, List, ListItem, ListItemText, Box, Divider } from "@mui/material";

export default function PrivacyPolicy() {
  const theme = useTheme();

  useEffect(() => {
    document.title = "Privacy Policy | UltiMafia";
  }, []);

  return (
    <>
      <Typography variant="h2" gutterBottom>
        Privacy Policy
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>

      <Typography variant="body1" paragraph>
        UltiMafia ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains 
        how we collect, use, disclose, and safeguard your information when you use our website, services, and 
        applications (collectively, the "Service"). Please read this Privacy Policy carefully. By using the 
        Service, you consent to the data practices described in this policy.
      </Typography>

      <Typography variant="body1" paragraph>
        This Privacy Policy is designed to comply with applicable privacy laws, including the General Data 
        Protection Regulation (GDPR) for users in the European Union, the UK GDPR for users in the United Kingdom, 
        the California Consumer Privacy Act (CCPA) for California residents, and other applicable United States 
        federal and state privacy laws.
      </Typography>

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          1. Information We Collect
        </Typography>
        
        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          1.1 Information You Provide to Us
        </Typography>
        <Typography variant="body1" paragraph>
          We collect information that you provide directly to us when you:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Create an account (email address, username, and authentication credentials);"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Link third-party accounts (such as Discord or Google) for authentication purposes;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Complete your profile (biographical information, pronouns, profile pictures, banners, 
              custom emotes, and other user-generated content);"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Participate in games, forums, or other interactive features;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Submit reports, appeals, or communicate with our moderation team;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Contact us for support or other inquiries."
            />
          </ListItem>
        </List>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          1.2 Automatically Collected Information
        </Typography>
        <Typography variant="body1" paragraph>
          When you access or use the Service, we automatically collect certain information, including:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Log Data: Internet Protocol (IP) addresses, browser type and version, device information, 
              operating system, pages visited, time and date of visits, time spent on pages, and other usage 
              statistics;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Cookies and Similar Technologies: We use cookies, web beacons, and similar tracking 
              technologies to collect information about your interactions with the Service. Cookies are small 
              data files stored on your device that help us improve your experience, remember your preferences, 
              and analyze usage patterns;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Game Data: Information related to your participation in games, including game history, 
              statistics, achievements, and performance data;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Account Activity: Information about your account activity, including login history, 
              feature usage, and interactions with other users."
            />
          </ListItem>
        </List>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          1.3 Information from Third-Party Services
        </Typography>
        <Typography variant="body1" paragraph>
          If you choose to authenticate using third-party services (such as Discord or Google), we may receive 
          certain information from those services, including your username, email address, and profile information, 
          in accordance with the authorization you provide and the privacy settings of those services.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use the information we collect for the following purposes:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="To provide, maintain, and improve the Service;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To create and manage your account, authenticate your identity, and process your 
              transactions;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To communicate with you about your account, the Service, updates, and promotional 
              materials (you may opt out of promotional communications at any time);"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To enforce our Terms of Service, Rules of Conduct, and other policies;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To investigate and respond to reports, appeals, and other user concerns;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To detect, prevent, and address fraud, security issues, and other harmful activities;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To analyze usage patterns and trends to improve the Service and user experience;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To comply with legal obligations and respond to lawful requests from government 
              authorities;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="To protect the rights, property, or safety of UltiMafia, our users, or others."
            />
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          3. Legal Basis for Processing (EU/UK Users)
        </Typography>
        <Typography variant="body1" paragraph>
          If you are located in the European Union or United Kingdom, we process your personal data based on the 
          following legal grounds:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Consent:</strong> When you have given clear consent for us to process your 
                  personal data for specific purposes;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Contract Performance:</strong> When processing is necessary for the performance 
                  of a contract with you or to take steps at your request before entering into a contract;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Legal Obligation:</strong> When processing is necessary for compliance with a 
                  legal obligation;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Legitimate Interests:</strong> When processing is necessary for our legitimate 
                  interests or those of a third party, such as preventing fraud, ensuring security, or improving 
                  our services, provided that your interests and fundamental rights do not override those interests.
                </>
              }
            />
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          4. How We Share Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We do not sell your personal information. We may share your information in the following circumstances:
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          4.1 Service Providers
        </Typography>
        <Typography variant="body1" paragraph>
          We may share your information with third-party service providers who perform services on our behalf, 
          such as hosting, data storage, analytics, payment processing, email delivery, and customer support. 
          These service providers are contractually obligated to protect your information and use it only for the 
          purposes for which it was shared.
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          4.2 Legal Requirements
        </Typography>
        <Typography variant="body1" paragraph>
          We may disclose your information if required to do so by law or in response to valid requests by public 
          authorities (e.g., a court or government agency), or if we believe disclosure is necessary to:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Comply with legal obligations or respond to legal process;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Protect and defend our rights or property;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Prevent or investigate possible wrongdoing in connection with the Service;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Protect the personal safety of users of the Service or the public."
            />
          </ListItem>
        </List>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          4.3 Business Transfers
        </Typography>
        <Typography variant="body1" paragraph>
          If we are involved in a merger, acquisition, or asset sale, your information may be transferred as part 
          of that transaction. We will provide notice before your information is transferred and becomes subject to 
          a different privacy policy.
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          4.4 With Your Consent
        </Typography>
        <Typography variant="body1" paragraph>
          We may share your information with your explicit consent or at your direction.
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          4.5 Public Information
        </Typography>
        <Typography variant="body1" paragraph>
          Certain information you choose to make public through your profile or in public areas of the Service 
          (such as usernames, profile pictures, and public game statistics) will be visible to other users and 
          may be accessible through search engines or other third-party services.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          5. Cookies and Tracking Technologies
        </Typography>
        <Typography variant="body1" paragraph>
          We use cookies and similar tracking technologies to collect and store information about your preferences 
          and activity on the Service. Cookies are small text files placed on your device when you visit our 
          website.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Types of Cookies We Use:</strong>
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Essential Cookies:</strong> Required for the Service to function properly, 
                  including authentication and security features. These cannot be disabled;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Functional Cookies:</strong> Remember your preferences and settings to enhance 
                  your experience;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Analytics Cookies:</strong> Help us understand how visitors interact with the 
                  Service to improve performance and user experience.
                </>
              }
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          You can control cookies through your browser settings. However, disabling certain cookies may limit 
          your ability to use some features of the Service. For more information about cookies and how to manage 
          them, please visit{" "}
          <Link href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">
            www.allaboutcookies.org
          </Link>.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          6. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate technical and organizational security measures to protect your personal 
          information against unauthorized access, alteration, disclosure, or destruction. These measures include 
          encryption, secure servers, access controls, and regular security assessments.
        </Typography>
        <Typography variant="body1" paragraph>
          However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
          strive to use commercially acceptable means to protect your information, we cannot guarantee absolute 
          security. You are responsible for maintaining the confidentiality of your account credentials.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          7. Data Retention
        </Typography>
        <Typography variant="body1" paragraph>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
          Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need 
          your information, we will delete or anonymize it in accordance with our data retention policies.
        </Typography>
        <Typography variant="body1" paragraph>
          If you delete your account, we will delete or anonymize your personal information, except where we are 
          required to retain it for legal, regulatory, or legitimate business purposes (such as maintaining game 
          records, resolving disputes, or enforcing our agreements).
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          8. International Data Transfers
        </Typography>
        <Typography variant="body1" paragraph>
          Your information may be transferred to and processed in countries other than your country of residence. 
          These countries may have data protection laws that differ from those in your country.
        </Typography>
        <Typography variant="body1" paragraph>
          If you are located in the European Union or United Kingdom, we ensure that appropriate safeguards are 
          in place for such transfers, including standard contractual clauses approved by the European Commission 
          or UK authorities, or other legally recognized transfer mechanisms.
        </Typography>
        <Typography variant="body1" paragraph>
          By using the Service, you consent to the transfer of your information to countries outside your country 
          of residence.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          9. Your Rights and Choices
        </Typography>
        <Typography variant="body1" paragraph>
          Depending on your location, you may have certain rights regarding your personal information:
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          9.1 Rights for EU/UK Users (GDPR/UK GDPR)
        </Typography>
        <Typography variant="body1" paragraph>
          If you are located in the European Union or United Kingdom, you have the following rights:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right of Access:</strong> Request a copy of the personal data we hold about you;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete 
                  data;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your 
                  personal data under certain circumstances;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Restrict Processing:</strong> Request restriction of processing of your 
                  personal data;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Data Portability:</strong> Receive your personal data in a structured, 
                  commonly used, and machine-readable format;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Object:</strong> Object to processing of your personal data based on 
                  legitimate interests;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Withdraw Consent:</strong> Withdraw consent where processing is based 
                  on consent.
                </>
              }
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          To exercise these rights, please contact us using the information provided in Section 14. We will 
          respond to your request within one month, though this period may be extended by two additional months 
          for complex requests.
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          9.2 Rights for California Residents (CCPA)
        </Typography>
        <Typography variant="body1" paragraph>
          If you are a California resident, you have the following rights under the California Consumer Privacy 
          Act:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Know:</strong> Request information about the categories and specific 
                  pieces of personal information we collect, use, disclose, or sell;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Delete:</strong> Request deletion of your personal information, subject 
                  to certain exceptions;
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we do 
                  not sell personal information);
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary={
                <>
                  <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for 
                  exercising your privacy rights.
                </>
              }
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          To exercise these rights, please contact us using the information provided in Section 14. We will 
          verify your identity before processing your request.
        </Typography>

        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
          9.3 Account Settings
        </Typography>
        <Typography variant="body1" paragraph>
          You can access and update certain information through your account settings on the Service. You may 
          also request deletion of your account, which will result in the deletion of your personal information 
          in accordance with our data retention policies.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          10. Children's Privacy
        </Typography>
        <Typography variant="body1" paragraph>
          The Service is not intended for children under the age of 13. We do not knowingly collect personal 
          information from children under 13. If you are a parent or guardian and believe that your child under 
          13 has provided us with personal information, please contact us immediately. If we become aware that we 
          have collected personal information from a child under 13 without parental consent, we will take steps 
          to delete that information.
        </Typography>
        <Typography variant="body1" paragraph>
          If you are between the ages of 13 and 18, you represent that you have obtained parental or guardian 
          consent to use the Service and that your parent or guardian has reviewed and agreed to our Terms of 
          Service and this Privacy Policy.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          11. Third-Party Links and Services
        </Typography>
        <Typography variant="body1" paragraph>
          The Service may contain links to third-party websites, services, or applications that are not owned or 
          controlled by UltiMafia. This Privacy Policy does not apply to such third-party services. We encourage 
          you to review the privacy policies of any third-party services you access.
        </Typography>
        <Typography variant="body1" paragraph>
          We are not responsible for the privacy practices or content of third-party services, including 
          authentication providers (such as Discord or Google) that you may use to access the Service.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          12. Changes to This Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
          legal requirements, or other factors. We will notify you of any material changes by:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary='Posting the updated Privacy Policy on this page with a new "Last Updated" date;'
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Sending you an email notification (if we have your email address);"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Displaying a prominent notice on the Service."
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          Your continued use of the Service after the effective date of any changes constitutes your acceptance 
          of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          13. Data Protection Officer (EU/UK Users)
        </Typography>
        <Typography variant="body1" paragraph>
          If you are located in the European Union or United Kingdom and have questions or concerns about our 
          data processing practices, you may contact our Data Protection Officer using the contact information 
          provided in Section 14.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          14. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
          please contact us:
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>By email:</strong> [Your contact email address]
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Through the Service:</strong> Use the contact methods available on the Service
        </Typography>
        <Typography variant="body1" paragraph>
          For EU/UK users exercising their GDPR/UK GDPR rights, please include "GDPR Request" or "UK GDPR Request" 
          in your subject line to help us process your request more efficiently.
        </Typography>
        <Typography variant="body1" paragraph>
          For California residents exercising their CCPA rights, please include "CCPA Request" in your subject 
          line.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          15. Your Consent
        </Typography>
        <Typography variant="body1" paragraph>
          By using the Service, you consent to our Privacy Policy and agree to its terms. If you do not agree 
          with this Privacy Policy, please do not use the Service.
        </Typography>
      </Box>
    </>
  );
}
