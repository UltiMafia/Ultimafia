import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { UiPageHeader } from "components/ui";

export default function StaffHandbook() {
  return (
    <Box className="staff-handbook">
      <UiPageHeader
        title="Staff Handbook"
        description="Last Updated: February 17, 2026"
      />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          1. Introduction & Purpose
        </Typography>
        <Typography variant="body1" paragraph>
          This handbook serves to provide guidelines and standards for staff
          conduct on UltiMafia.com. This is a public document for users to refer to
          in order to understand the expectations and responsibilities of our admin team.
          Staff can refer to this page to ensure they are upholding site values
          and executing protocol regarding staff actions and decisions.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          2. Mission Statement
        </Typography>
        <Typography variant="body1" paragraph>
          UltiMafia seeks to create an inclusive and welcoming space for
          playing chat-based Mafia and related minigames. Our goal is to
          provide a fair and respectful environment where all players can enjoy
          the game free from hostility. We are dedicated to maintaining a
          community free from prejudice or bias based on sex, age, gender
          identity, sexual orientation, skin color, ability, religion,
          nationality, or any other characteristic.{" "}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          3. Responsibilities
        </Typography>
        <Typography variant="body1" paragraph>
          Staff are responsible for maintaining the integrity, fairness, and stability
          of the UltiMafia platform. This includes moderating games and chat,
          enforcing site rules, responding to user reports, and addressing disruptive
          behavior in a timely and consistent manner. Staff are expected to act in
          good faith, use sound judgment, and prioritize the health of the community
          over personal preferences or competitive outcomes.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          4. Standards of Conduct
        </Typography>
        <Typography variant="body1" paragraph>
          Staff are held to a higher standard than regular users. They are expected to
          demonstrate professionalism and respect in all interactions with both users
          and fellow staff, including in games. Staff should not engage in favoritism
          for certain users, should be respectful in all discussions or arguments regarding
          game events, site contents, or staff decisions, and should avoid engaging in drama. 
          Staff shall not insult either users or fellow staff, even in the heat of games.
        </Typography>
        <Typography variant="body1" paragraph>
          Strictly speaking, staff are not restricted from criticizing the site. Staff
          are free to provide constructive feedback and suggestions for improvement,
          and to express their own beliefs and frustrations in public. That being said: Staff are expected
          to represent the site and team in public discourse and users will often conflate
          the words of a member of Staff with the words of the team or site as a whole, so Staff are
          asked to be mindful of their conduct.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          5. Confidentiality
        </Typography>
        <Typography variant="body1" paragraph>
          Oftentimes, staff will have access to sensitive information about users, games, 
          or site operations. Staff are expected to maintain confidentiality and not 
          disclose any information that is not already public. 
          This includes information about user reports, disciplinary actions, 
          internal discussions, or any other non-public information. Breaching confidentiality 
          can undermine trust in the admin team and harm the website. Moderator communications in site leadership channels
          are not necessarily confidential, but sharing information from those channels with intent to harm the site or share
          confidential information about users or internal operations is strictly forbidden.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          6. Conflict of Interest
        </Typography>
        <Typography variant="body1" paragraph>
          Staff should avoid situations where personal relationships, rivalries, or
          competitive interests could reasonably affect their judgment. If a member of staff is
          directly involved in a game, dispute, or report, they should recuse themselves
          and defer the matter to another staff member whenever possible. If no other party
          is available, defer to the site owner or acting head admin in their stead if unavailable.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          7. Use of Authority
        </Typography>
        <Typography variant="body1" paragraph>
          Staff have discretion to use their authority where they see fit. Users only need one verbal 
          warning before a member of staff takes action. Staff are free to complete reports according to their 
          own judgment; one does not need to wait for other opinions if they don't feel the need to. 
          Staff are to maintain the atmosphere of hospitality and acceptance in every game they join 
          and every discussion they participate in. Staff are not to use their authority to retaliate against users 
          following the decisions of another staff or to target users for personal reasons. Do not use 
          one's authority to threaten users with Staff action in the face of noncompliance.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          8. Activity & Timeliness
        </Typography>
        <Typography variant="body1" paragraph>
          User reports are expected to be completed by staff within 48 hours of their filing, except in cases 
          where further deliberation is required or, in rare cases, where police are expected to be 
          contacted. Staff are expected to respond within 48 hours to site leadership channels, unless the 
          member of staff has previously reported an expected gap or lapse in activity (i.e. a personal leave or 
          real-life matters.) Holding rank as site staff is voluntary; therefore, this guideline will not be strictly 
          kept unless a member of staff's activity lapses for 30 days or more, in which case they are liable to be 
          removed and reinstated at another time when availability improves.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          9. Enforcement & Consequences
        </Typography>
        <Typography variant="body1" paragraph>
          The site owner allots all staff two chances: one warning for conduct in violation of this handbook 
          and then immediate removal from the admin team if another incident occurs. This is a universal conduct warning, 
          not specific to rule infractions. The site owner may choose to remove staff at their discretion for 
          severe misconduct. Admin abuse will not be tolerated.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ my: 3 }}>
        <Typography variant="h3" gutterBottom>
          10. Reporting & Contact
        </Typography>
        <Typography variant="body1" paragraph>
          Users are expected to report any concerns with staff conduct via the site's Report function. Staff are not 
          to affect the status of reports filed on themselves. All reports on staff are left up to site owner discretion. 
          Not all reports result in public action or disclosure. Users can also contact the site owner directly in matters of 
          confidentiality.
        </Typography>
      </Box>
    </Box>
  );
}
