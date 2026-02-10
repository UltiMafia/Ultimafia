import React from "react";
import { Box, Typography } from "@mui/material";

export default function AdminHandbook() {
  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Admin Handbook
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Last Updated: February 10, 2026
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        1. Introduction & Purpose
      </Typography>
      <Typography sx={{ mb: 2 }}>
        This handbook serves to provide guidelines and standards for admin and staff
        conduct on UltiMafia.com. This is a public document for users to refer to
        in order to understand the expectations and responsibilities of our admin team.
        Admins and staff can refer to this page to ensure they are upholding the values
        and executing protocol regarding staff actions and decisions.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        2. Mission Statement
      </Typography>
      <Typography sx={{ mb: 2 }}>
        UltiMafia seeks to create an inclusive and welcoming space for
        playing chat-based Mafia and related minigames. Our goal is to
        provide a fair and respectful environment where all players can enjoy
        the game free from hostility. We are dedicated to maintaining a
        community free from prejudice or bias based on sex, age, gender
        identity, sexual orientation, skin color, ability, religion,
        nationality, or any other characteristic.{" "}
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        3. Responsibilities
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Admins are responsible for maintaining the integrity, fairness, and stability
        of the UltiMafia platform. This includes moderating games and chat,
        enforcing site rules, responding to user reports, and addressing disruptive
        behavior in a timely and consistent manner. Admins are expected to act in
        good faith, use sound judgment, and prioritize the health of the community
        over personal preferences or competitive outcomes.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        4. Standards of Conduct
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Admins are held to a higher standard than regular users. They are expected to
        demonstrate professionalism and respect in all interactions with both users
        and fellow staffs, including in games. Admins should not engage in favoritism
        for certain users, should be respectful in all discussions or arguments regarding
        game events, site contents, or staff decisions, and should avoid engaging in drama.
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Strictly speaking, admins are not restricted from criticizing the site. Admins
        are free to provide constructive feedback and suggestions for improvement,
        and to express their own beliefs and frustrations in public. Admins are expected
        to represent the site and team in public discourse and users will often conflate
        the words of an admin with the words of the team or site as a whole, so admins are
        asked to be mindful of their conduct.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        5. Confidentiality
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Oftentimes, admins will have access to sensitive information about users, games, 
        or site operations. Admins are expected to maintain confidentiality and not 
        disclose any information that is not already public. 
        This includes information about user reports, disciplinary actions, 
        internal discussions, or any other non-public information. Breaching confidentiality 
        can undermine trust in the admin team and harm the website. Moderator communications in site leadership channels
        are not necessarily confidential, but sharing information from those channels with intent to harm the site or share
        confidential information about users or internal operations is strictly forbidden.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        6. Conflict of Interest
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Admins should avoid situations where personal relationships, rivalries, or
        competitive interests could reasonably affect their judgment. If an admin is
        directly involved in a game, dispute, or report, they should recuse themselves
        and defer the matter to another staff member whenever possible. If no other party
        is available, defer to the site owner or acting head admin in their stead if unavailable.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        7. Use of Authority
      </Typography>
      <Typography sx={{ mb: 2 }}>
      Admins have discretion to use their authority where they see fit. Users only need one verbal 
      warning before an admin takes action. Admins are free to complete reports according to their 
      own judgment; one does not need to wait for other opinions if they don't feel the need to. 
      Admins are to maintain the atmosphere of hospitality and acceptance in every game they join 
      and every discussion they participate in. Do not use one's authority to retaliate against users 
      following the decisions of another admin or to target users for personal reasons. Do not use 
      one's authority to threaten users with admin action in the face of noncompliance.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        8. Enforcement & Consequences
      </Typography>
      <Typography sx={{ mb: 2 }}>
        The site owner allots all admins two chances: one warning for conduct in violation of this handbook 
        and then immediate removal from the admin if another incident occurs. This is a universal conduct warning, 
        not specific to rule infractions. The site owner may choose to remove admins at their discretion for 
        severe misconduct. Admin abuse will not be tolerated.
      </Typography>

      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        9. Reporting & Contact
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Users are expected to report any concerns with admin conduct via the site's Report function. Admins are not 
        to affect the status of reports filed on themselves. All reports on admins are left up to site owner discretion. 
        Not all reports result in public action or disclosure. Users can also contact the site owner directly in matters of 
        confidentiality.
      </Typography>
    </Box>
  );
}
