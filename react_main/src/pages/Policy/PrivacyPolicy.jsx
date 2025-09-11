import React, { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Typography, Link, List, ListItem, ListItemText } from "@mui/material";

export default function PrivacyPolicy() {
  const theme = useTheme();

  useEffect(() => {
    document.title = "Privacy Policy | UltiMafia";
  }, []);

  return (
    <>
      <Typography variant="h2" gutterBottom>
        Privacy Policy of UltiMafia
      </Typography>
      <Typography variant="body1" paragraph>
        UltiMafia operates the UltiMafia.com website, which provides the
        SERVICE.
      </Typography>
      <Typography variant="body1" paragraph>
        This page is used to inform website visitors regarding our policies with
        the collection, use, and disclosure of Personal Information if anyone
        decided to use our Service, the UltiMafia website.
      </Typography>
      <Typography variant="body1" paragraph>
        If you choose to use our Service, then you agree to the collection and
        use of information in relation with this policy. The Personal
        Information that we collect are used for providing and improving the
        Service. We will not use or share your information with anyone except as
        described in this Privacy Policy.
      </Typography>
      <Typography variant="body1" paragraph>
        The terms used in this Privacy Policy have the same meanings as in our
        Terms and Conditions, which is accessible at UltiMafia.com, unless
        otherwise defined in this Privacy Policy. Our Privacy Policy was created
        with the help of the{" "}
        <Link
          href="https://www.privacypolicytemplate.net"
          rel="noopener noreferrer nofollow"
        >
          Privacy Policy Template
        </Link>{" "}
        and the{" "}
        <Link
          href="https://www.disclaimer-template.net"
          rel="noopener noreferrer nofollow"
        >
          Disclaimer Template
        </Link>
        .
      </Typography>
      <Typography variant="h3" gutterBottom>
        Information Collection and Use
      </Typography>
      <Typography variant="body1" paragraph>
        For a better experience while using our Service, we may require you to
        provide us with certain personally identifiable information, including
        but not limited to your email address and usernames on other services.
        You may also voluntarily upload any of your own personal information you
        wish for your profile, including but not limited to photos and textual
        data.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Log Data
      </Typography>
      <Typography variant="body1" paragraph>
        We want to inform you that whenever you visit our Service, we collect
        information that your browser sends to us that is called Log Data. This
        Log Data may include information such as your computer’s Internet
        Protocol ("IP") address, browser version, pages of our Service that you
        visit, the time and date of your visit, the time spent on those pages,
        and other statistics.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Cookies
      </Typography>
      <Typography variant="body1" paragraph>
        Cookies are files with small amounts of data that is commonly used as an
        anonymous unique identifier. These are sent to your browser from the
        website that you visit and are stored on your computer’s hard drive.
      </Typography>
      <Typography variant="body1" paragraph>
        Our website uses these "cookies" to collect information and to improve
        our Service. You have the option to either accept or refuse these
        cookies by either logging in or choosing not to log in. If you choose to
        refuse our cookies, you may not be able to use some portions of our
        Service, which includes any features that require a user to be signed
        in.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Service Providers
      </Typography>
      <Typography variant="body1" paragraph>
        We may employ third-party companies and individuals due to the following
        reasons:
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="To facilitate our Service;" />
        </ListItem>
        <ListItem>
          <ListItemText primary="To provide the Service on our behalf;" />
        </ListItem>
        <ListItem>
          <ListItemText primary="To perform Service-related services;" />
        </ListItem>
        <ListItem>
          <ListItemText primary="To assist us in analyzing how our Service is used." />
        </ListItem>
      </List>
      <Typography variant="body1" paragraph>
        We want to inform our Service users that these third parties have access
        to your Personal Information. The reason is to perform the tasks
        assigned to them on our behalf. However, they are obligated not to
        disclose or use the information for any other purpose.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Security
      </Typography>
      <Typography variant="body1" paragraph>
        We value your trust in providing us your Personal Information, thus we
        are striving to use commercially acceptable means of protecting it. But
        remember that no method of transmission over the internet, or method of
        electronic storage is 100% secure and reliable, and we cannot guarantee
        its absolute security.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Links to Other Sites
      </Typography>
      <Typography variant="body1" paragraph>
        Our Service may contain links to other sites. If you click on a
        third-party link, you will be directed to that site. Note that these
        external sites are not operated by us. Therefore, we strongly advise you
        to review the Privacy Policy of these websites. We have no control over,
        and assume no responsibility for the content, privacy policies, or
        practices of any third-party sites or services.
      </Typography>
      <Typography variant="body1" paragraph>
        Children’s Privacy
      </Typography>
      <Typography variant="body1" paragraph>
        Our Services do not address anyone under the age of 13. We do not
        knowingly collect personally identifiable information from children
        under 13. In the case we discover that a child under 13 has provided us
        with personal information, we immediately delete this from our servers.
        If you are a parent or guardian and you are aware that your child has
        provided us with personal information, please contact us so that we will
        be able to take necessary actions.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Changes to This Privacy Policy
      </Typography>
      <Typography variant="body1" paragraph>
        We may update our Privacy Policy from time to time. Thus, we advise you
        to review this page periodically for any changes. We will notify you of
        any changes by posting the new Privacy Policy on this page. These
        changes are effective immediately, after they are posted on this page.
      </Typography>
      <Typography variant="h3" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" paragraph>
        If you have any questions or suggestions about our Privacy Policy, do
        not hesitate to contact us.
      </Typography>
    </>
  );
}
