import React, { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Typography, Link, List, ListItem, ListItemText, Box, Divider } from "@mui/material";

export default function TermsOfService() {
  const theme = useTheme();

  useEffect(() => {
    document.title = "Terms of Service | UltiMafia";
  }, []);

  return (
    <>
      <Typography variant="h2" gutterBottom>
        Terms of Service
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Last Updated: February 6, 2026
      </Typography>

      <Typography variant="body1" paragraph>
        Welcome to UltiMafia. These Terms of Service ("Terms") govern your access to and use of the UltiMafia website, 
        services, and applications (collectively, the "Service") operated by UltiMafia ("we," "us," or "our"). 
        By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of 
        these Terms, you may not access or use the Service.
      </Typography>

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body1" paragraph>
          By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, 
          and agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference. 
          These Terms constitute a legally binding agreement between you and UltiMafia.
        </Typography>
        <Typography variant="body1" paragraph>
          You must be at least 13 years of age to use the Service. If you are under 18 years of age, you represent 
          that you have obtained parental or guardian consent to use the Service and that your parent or guardian 
          agrees to these Terms on your behalf.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          2. User Accounts and Registration
        </Typography>
        <Typography variant="body1" paragraph>
          To access certain features of the Service, you must create an account. You agree to:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Provide accurate, current, and complete information during registration;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Maintain and promptly update your account information to keep it accurate, current, and complete;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Maintain the security of your account credentials and accept responsibility for all activities 
              that occur under your account;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Notify us immediately of any unauthorized use of your account or any other breach of security;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Not share your account credentials with any third party;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Not use automated means to create accounts."
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          We reserve the right to suspend or terminate your account if you violate these Terms or engage in any 
          fraudulent, abusive, or illegal activity.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          3. User-Generated Content and Intellectual Property Rights
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Ownership of User Content:</strong> You retain all ownership rights to any content you upload, 
          post, transmit, or otherwise make available through the Service, including but not limited to avatars, 
          custom emotes, profile banners, profile backgrounds, biographical information, and any other materials 
          (collectively, "User Content").
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Warranty of Rights:</strong> By uploading, posting, or transmitting User Content, you represent 
          and warrant that:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="You own the User Content or possess all necessary rights, licenses, consents, and permissions 
              to use and authorize us to use the User Content as contemplated by these Terms;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="The User Content does not and will not infringe, violate, or misappropriate any third-party 
              rights, including intellectual property rights, privacy rights, or publicity rights;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="You have obtained all necessary consents and releases from any individuals depicted in your 
              User Content;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="The User Content complies with all applicable laws and regulations."
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Removal of User Content:</strong> We reserve the right, but are not obligated, to review, 
          monitor, edit, or remove any User Content at any time, without prior notice, for any reason, including 
          if we determine in our sole discretion that such User Content violates these Terms, is illegal, or is 
          otherwise objectionable.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>No Compensation:</strong> You acknowledge that you will not receive any compensation for the 
          hosting of your User Content by UltiMafia or other users of the Service.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          4. Acceptable Use Policy
        </Typography>
        <Typography variant="body1" paragraph>
          You agree not to use the Service to:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Violate any applicable local, state, national, or international law or regulation;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Infringe upon or violate our intellectual property rights or the intellectual property rights 
              of others;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based 
              on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Submit false or misleading information, including false reports or appeals;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Upload or transmit viruses, malware, or any other malicious code;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Collect or track the personal information of others without their consent;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Spam, phish, pharm, pretext, spider, crawl, or scrape the Service;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Interfere with or disrupt the Service or servers or networks connected to the Service;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Attempt to gain unauthorized access to the Service, other accounts, computer systems, or 
              networks connected to the Service;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Use the Service for any commercial purpose without our express written consent;"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Impersonate any person or entity or misrepresent your affiliation with any person or entity."
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          Violation of this Acceptable Use Policy may result in immediate termination of your account and 
          potential legal action.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          5. Rules of Conduct and Moderation
        </Typography>
        <Typography variant="body1" paragraph>
          The Service includes community rules and standards of conduct that all users must follow. These rules 
          are detailed in our <Link href="/policy/rules">Rules of Conduct</Link> and are incorporated into 
          these Terms by reference. You agree to comply with all applicable rules and understand that violations 
          may result in warnings, temporary suspensions, permanent bans, or other disciplinary actions as 
          determined by our moderation team. The moderation team has sole discretion in enforcing the rules.
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to investigate violations of these Terms or our Rules of Conduct and to take 
          appropriate legal action, including but not limited to reporting violations to law enforcement 
          authorities.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          6. Reporting and Appeals
        </Typography>
        <Typography variant="body1" paragraph>
          Users may report violations of our Rules of Conduct through the Service's reporting system. Reports 
          are reviewed by our moderation team, and appropriate action will be taken in accordance with our 
          policies.
        </Typography>
        <Typography variant="body1" paragraph>
          If you receive a warning, suspension, or ban, you may appeal the decision through the Service's 
          appeals system. Appeals are reviewed by our moderation team, and decisions are final. We reserve the 
          right to modify or reverse disciplinary actions at our sole discretion.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          7. Service Availability and Modifications
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to modify, suspend, or discontinue the Service, or any part thereof, at any time, 
          with or without notice. We do not guarantee that the Service will be available at all times or that it 
          will be free from errors, defects, or interruptions.
        </Typography>
        <Typography variant="body1" paragraph>
          We may update, change, or modify features of the Service at any time. We are not obligated to provide 
          support or maintenance for the Service, though we may do so at our discretion.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          8. Third-Party Services and Links
        </Typography>
        <Typography variant="body1" paragraph>
          The Service may contain links to third-party websites, services, or resources that are not owned or 
          controlled by UltiMafia. We have no control over and assume no responsibility for the content, privacy 
          policies, or practices of any third-party services.
        </Typography>
        <Typography variant="body1" paragraph>
          You acknowledge and agree that UltiMafia shall not be responsible or liable, directly or indirectly, 
          for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance 
          on any such content, goods, or services available on or through any such third-party services.
        </Typography>
        <Typography variant="body1" paragraph>
          The Service may integrate with third-party authentication providers (such as Discord or Google). Your 
          use of such third-party services is subject to their respective terms of service and privacy policies.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          9. Disclaimer of Warranties
        </Typography>
        <Typography variant="body1" paragraph>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
          IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
          PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
        </Typography>
        <Typography variant="body1" paragraph>
          UltiMafia does not warrant that the Service will be uninterrupted, secure, or error-free, that defects 
          will be corrected, or that the Service or the server that makes it available are free of viruses or 
          other harmful components.
        </Typography>
        <Typography variant="body1" paragraph>
          Some jurisdictions do not allow the exclusion of certain warranties, so some of the above exclusions 
          may not apply to you.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          10. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ULTIMAFIA, ITS AFFILIATES, AGENTS, 
          DIRECTORS, EMPLOYEES, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, 
          CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, 
          USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, 
          THE SERVICE.
        </Typography>
        <Typography variant="body1" paragraph>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ULTIMAFIA ASSUMES NO LIABILITY OR RESPONSIBILITY FOR 
          ANY (I) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT; (II) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY 
          NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO OR USE OF OUR SERVICE; (III) ANY UNAUTHORIZED ACCESS 
          TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION STORED THEREIN; (IV) ANY 
          INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICE; (V) ANY BUGS, VIRUSES, TROJAN HORSES, 
          OR THE LIKE, WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICE BY ANY THIRD PARTY; AND/OR (VI) ANY 
          ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF YOUR 
          USE OF ANY CONTENT POSTED, EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICE.
        </Typography>
        <Typography variant="body1" paragraph>
          IN NO EVENT SHALL ULTIMAFIA'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT YOU PAID TO 
          ULTIMAFIA IN THE TWELVE (12) MONTHS PRIOR TO THE ACTION GIVING RISE TO LIABILITY, OR ONE HUNDRED 
          DOLLARS ($100), WHICHEVER IS GREATER.
        </Typography>
        <Typography variant="body1" paragraph>
          Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, 
          so the above limitations or exclusions may not apply to you.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          11. Indemnification
        </Typography>
        <Typography variant="body1" paragraph>
          You agree to defend, indemnify, and hold harmless UltiMafia and its affiliates, licensors, and service 
          providers, and their respective officers, directors, employees, contractors, agents, licensors, suppliers, 
          successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, 
          costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your 
          violation of these Terms or your use of the Service, including but not limited to your User Content, 
          any use of the Service's content, services, and products other than as expressly authorized in these 
          Terms, or your use of any information obtained from the Service.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          12. Termination
        </Typography>
        <Typography variant="body1" paragraph>
          We may terminate or suspend your account and access to the Service immediately, without prior notice or 
          liability, for any reason, including if you breach these Terms.
        </Typography>
        <Typography variant="body1" paragraph>
          Upon termination, your right to use the Service will immediately cease. If you wish to terminate your 
          account, you may do so by contacting us or using the account deletion feature, if available.
        </Typography>
        <Typography variant="body1" paragraph>
          All provisions of these Terms which by their nature should survive termination shall survive termination, 
          including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations 
          of liability.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          13. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision 
          is material, we will provide at least 30 days' notice prior to any new terms taking effect. What 
          constitutes a material change will be determined at our sole discretion.
        </Typography>
        <Typography variant="body1" paragraph>
          By continuing to access or use our Service after any revisions become effective, you agree to be bound 
          by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the 
          Service.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          14. Governing Law and Dispute Resolution
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>For Users in the European Union and United Kingdom:</strong> These Terms shall be governed by 
          and construed in accordance with the laws of the jurisdiction in which UltiMafia operates, without regard 
          to its conflict of law provisions. Any disputes arising out of or relating to these Terms or the Service 
          shall be subject to the exclusive jurisdiction of the courts of that jurisdiction. However, if you are 
          a consumer resident in the EU or UK, you may also bring proceedings in your country of residence.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>For Users in the United States:</strong> These Terms shall be governed by and construed in 
          accordance with the laws of the State of [Your State], United States, without regard to its conflict of 
          law provisions. Any disputes arising out of or relating to these Terms or the Service shall be resolved 
          through binding arbitration in accordance with the rules of the American Arbitration Association, except 
          that you may assert claims in small claims court if your claims qualify.
        </Typography>
        <Typography variant="body1" paragraph>
          You and UltiMafia agree that any dispute resolution proceedings will be conducted only on an individual 
          basis and not in a class, consolidated, or representative action.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          15. Severability
        </Typography>
        <Typography variant="body1" paragraph>
          If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining 
          provisions of these Terms will remain in effect. The invalid or unenforceable provision will be replaced 
          with a valid provision that comes closest to the intent of the invalid provision.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          16. Entire Agreement
        </Typography>
        <Typography variant="body1" paragraph>
          These Terms, together with our Privacy Policy and Rules of Conduct, constitute the entire agreement 
          between you and UltiMafia regarding the Service and supersede all prior and contemporaneous written or 
          oral agreements between you and UltiMafia.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          17. Contact Information
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about these Terms, please contact us through the Service's contact methods 
          or by emailing us at the contact information provided in our Privacy Policy.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          18. Acknowledgment
        </Typography>
        <Typography variant="body1" paragraph>
          BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND 
          BY THEM.
        </Typography>
      </Box>
    </>
  );
}
