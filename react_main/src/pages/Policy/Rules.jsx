import React, { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useViolations } from "../../hooks/useViolations";

const OFFENSE_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

const cellSx = {
  backgroundColor: "var(--scheme-color-sec)",
};

const headerCellSx = {
  ...cellSx,
  fontWeight: "bold",
};

/**
 * Rules text from docs/SPORTSMANSHIP.txt (Rules section only).
 * Content must stay AS-IS — do not rewrite wording.
 * violationId maps to data/violations.js for offense length tables.
 */
const RULES_SECTIONS = [
  {
    type: "intro",
    paragraphs: [
      "When you choose to spend your time on Ultimafia, you agree to uphold a level of sportsmanship. We define sportsmanship on Ultimafia as:",
    ],
    bullets: [
      "Being ethical and lawful: Follow the Ultimafia rules and do not partake in actions or activities that could jeopardise the website.",
      "Playing fair: Using the tools provided in the game to win the game to the best of your ability.",
      "Being respectful: Respecting your fellow players and their time, as well as the volunteer admins and their time.",
    ],
    afterBullets: [
      "Admins will do their best to help any and all users enjoy the time they choose to spend on Ultimafia, and in order to facilitate that we ask that users follow the rules outlined on this page. Unsportsmanlike conduct may result in temporary or permanent banishment from games or Ultimafia.",
    ],
  },
  {
    type: "rule",
    title: "Follow site-wide rules at all times",
    paragraphs: [
      "Breaking site-wide rules may result in harsher punishment than listed depending on the severity of the rule broken.",
    ],
  },
  {
    type: "rule",
    title: "Be accepting",
    paragraphs: [
      'You are expected to contribute to an accepting environment. Do not discriminate against or disrespect other users based on group identity. The admin team’s mission statement intends to, "maintain[ing] a community free from prejudice or bias based on sex, age, gender identity, sexual orientation, skin color, ability, religion, nationality, or any other characteristic.”',
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Racism, homophobia, transphobia, misogyny, religious discrimination, xenophobia, ableism, or any other form of bigotry otherwise not listed. ",
      'The use of slurs, derogatory language, or bigoted expressions, including instances where an individual belongs to the affected group or claims the language is being "reclaimed." ',
      "bypassing slur filters.",
      "denial or minimization of acts of genocide or systemic oppression of minority groups. ",
    ],
    closing: ["Breaking this rule will result in an Intolerance violation."],
    violationId: "intolerance",
  },
  {
    type: "rule",
    title: "Be respectful",
    paragraphs: [
      "You are expected to communicate with your fellow users with understanding. Do not insult or attack fellow users meaningfully, regardless of intent or game state. ",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Attacks on intelligence or ability.[a]",
      "Targeted deliberate antagonisation. [b]",
      "Conduct intended to intimidate or demean, even when ‘justified’.[c]",
      "Continuing behaviour or conduct that has been clearly identified as upsetting. (i.e. “Stop clause”)",
      "Creating accounts with the intent to defame or frame, including impersonation.",
    ],
    closing: [
      "Breaking this rule will result in a Personal Attacks & Harassment (PA) violation.",
    ],
    violationId: "personal-attacks-harassment",
  },
  {
    type: "rule",
    title: "Be civil",
    paragraphs: [
      "You are expected to keep discussions, in-game and out, civilised. Do not intentionally provoke or escalate conflict between users, whether between yourself and another, or two separate parties. ",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Engaging in trolling behavior, including concern trolling, political trolling, etc.",
      "Spamming messages anywhere on the site, including reports.",
      "Initiating or encouraging large-scale public arguments.",
      "Disingenuously promoting drama or division within community spaces.",
      "Deliberately joining multiple games with user(s) avoiding you.[d]",
      "Repeatedly leaving and rejoining games, particularly when a match is about to begin",
    ],
    closing: ["Breaking this rule will result in an Instigation violation."],
    violationId: "instigation",
  },
  {
    type: "rule",
    title: "Welcome new players",
    paragraphs: [
      "You are expected to show patience and kindness towards new players. Do not discriminate against or mistreat users based solely on the fact that they are a new user.",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Engaging in policy-based voting against new users without merit.",
      "Falsely accusing new users of rule violations.",
      "Promoting attitudes or practices that discourage community growth.",
    ],
    closing: ["Breaking this rule will result in a Hazing violation."],
    violationId: "hazing",
  },
  {
    type: "rule",
    title: "Respect Privacy",
    paragraphs: [
      "We do not expect users to have their personal information revealed if they don’t want it to be. Do not reveal the personal or identifying information of other users without their consent.",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: ["Real names.", "Locations or addresses.", "Ages."],
    closing: ["Breaking this rule will result in a Doxxing violation."],
    violationId: "outing-personal-information",
  },
  // Suspension Circumvention (SC) — commented out for now
  // {
  //   type: "rule",
  //   title: "Respect Admin decisions",
  //   paragraphs: [
  //     "Admins have the final say in all decisions regarding rules and conduct. Do not circumvent these decisions by playing or posting on an alternate account when suspended.",
  //   ],
  //   closing: [
  //     "Breaking this rule will result in a Suspension Circumvention (SC) violation.",
  //   ],
  // },
  {
    type: "rule",
    title: "Keep it PG13",
    paragraphs: [
      "Do not post content inappropriate for users under the age of 18. You may not create, share, display, or distribute content otherwise considered 'Not Safe for Work'. ",
    ],
    bulletsIntro: "Including but is not limited to:",
    bullets: [
      "Graphic, written, or visual depictions of sexual activity or explicit acts",
      "Descriptions or portrayals of illegal drug use and/or behavior that promotes substance abuse",
      "Lewd, obscene, or sexually explicit language",
      "Content intended to shock, disturb, or offend others (i.e. shock sites, gore, etc.)",
      "Access to or promotion of pornographic websites",
      "Descriptions or depictions of real violence or assault",
    ],
    closing: [
      "Breaking this rule will result in an Adult Content (AC) violation.",
    ],
    violationId: "adult-content",
  },
  {
    type: "rule",
    title: "Follow the law ",
    paragraphs: [
      "Do not share, link to, or participate in illegal or potentially illegal activity. Moderation reserves the right to report suspected illegal activity to appropriate law enforcement authorities whenever possible and as required by law.",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Inappropriate or unlawful interactions involving a minor.",
      "The distribution, solicitation, or possession of CSAM.",
      "Promotion or facilitation of terrorism or organized criminal activity.",
      "Credible threats of violence or otherwise real world harm.",
    ],
    closing: [
      "Breaking this rule will result in an immediate and permanent site-wide ban.",
    ],
    violationId: "illegal-content-activity",
  },
  {
    type: "section",
    title: "Play fair and with respect",
  },
  {
    type: "rule",
    title: "Play to win",
    paragraphs: [
      "You are expected to play to win in ranked or competitive games. Do not intentionally play against your win condition.",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Purposefully taking actions or making claims that hinder your win condition.",
      "Drawing the game when there is still a path to victory.",
      "Prioritising another player’s loss at the cost of your own win condition.",
    ],
    closing: [
      "Breaking this rule will result in a Gamethrowing (GT) violation.",
    ],
    violationId: "game-throwing",
  },
  {
    type: "rule",
    title: "Stay engaged",
    paragraphs: [
      "Read and participate meaningfully in ranked or competitive games, and do not AFK or “tab out”. If a user must step away, they are expected to notify other users and review the progress of the game upon returning to ensure vital information is not missed.",
    ],
    bulletsIntro: "Included but not limited to:",
    bullets: [
      "Diverting attention to unrelated activities.",
      "Pretending to be or faking AFK.",
      "Exclusively using gimmicks in place of participation.",
      "Exclusively discussing unrelated topics.",
    ],
    closing: [
      "Breaking this rule will result in an Insufficient Participation (ISP) violation.",
    ],
    violationId: "insufficient-participation",
  },
  {
    type: "rule",
    title: "Keep the game within the game",
    paragraphs: [
      "Do not use tools or processes from outside of a ranked or competitive game to aid or influence yourself in winning the game. ",
    ],
    bulletsIntro: "Included but not limited to:",
    bullets: [
      "Posting on profiles, lobbies, forums, the Ultimafia Discord server during the game.",
      "Clearly stating meta on your profile, whether followed or not.",
      "Bribing or threatening a consequence unrelated to the game.",
      "Making pregame pacts.",
      "Accusing other players of rule breaking, or threatening to report them.",
      "Pretending to cheat or break a rule.",
    ],
    closing: [
      "Breaking this rule will result in an Outside Game Influence (OGI) violation.",
    ],
    violationId: "outside-game-information",
  },
  {
    type: "rule",
    title: "Keep the game fun",
    paragraphs: [
      "You are expected to play in good faith. Do not play with the purpose of antagonising other users. ",
    ],
    bulletsIntro: "Including but not limited to:",
    bullets: [
      "Intentionally and repeatedly disrupting gameplay.",
      "Bad-faith gameplay (e.g., 'hip-firing' or gunshots based on no or minimal information)",
      "Communication with the primary intent of provoking or upsetting other users.",
    ],
    closing: [
      "Breaking this rule will result in an Antagonisation violation.",
    ],
    violationId: "antagonization",
  },
  // Repeated Abandonment (RA) — commented out for now
  // {
  //   type: "rule",
  //   title: "Commit to complete games you join",
  //   paragraphs: [
  //     "You are not expected to prioritise the game over real life or emergencies, but do not join ranked or competitive games you know you cannot complete.",
  //     "Breaking this rule in a ranked game will result in a 5 minute suspension and an abandonment on your win rate.",
  //     "Breaking this rule in a competitive game will result in an 15 minute suspension and an abandonment on your win rate.",
  //     "Frequently breaking this rule will result in a Repeated Abandonment (RA) violation.",
  //   ],
  // },
  {
    type: "rule",
    title: "Play it out until the end",
    paragraphs: [
      "Do not abandon ranked or competitive games for any in-game reasons. If there are any bugs, exploits, or rule breaks, players are expected to play the game to completion and report the issues afterwards. ",
      "Breaking this rule will result in a Game-Related Abandonment (GRA) violation. Exceptions can very rarely be made under extreme circumstances at admin discretion i.e. extreme harassment.",
    ],
    violationId: "game-related-abandonment",
  },
  {
    type: "rule",
    title: "Report bugs and exploits",
    paragraphs: [
      "If a bug or exploit is found, do not hide it from the admin team and do not abuse it in ranked or competitive games.",
      "Breaking this rule will result in a Bug Abuse (BA) violation.",
    ],
    violationId: "exploits",
  },
  {
    type: "rule",
    title: "Do not cheat",
    paragraphs: [
      "Cheating is defined as extreme cases of manipulation or conduct that provides an unfair competitive advantage or undermines the integrity of ranked and competitive games.",
    ],
    bulletsIntro: "Including and not limited to:",
    bullets: [
      "Using multiple accounts within the same game ('multiaccounting' or 'alt'ing').",
      "Communicating with other participants through external means not within an in-progress game.",
      "Taking screenshots or other methods of sharing in game information to prove alignment or gain strategic advantage.",
      "Coordinating externally for specific outcomes, or playing with the intent of ensuring another user's victory via external coordination.",
    ],
    closing: ["Breaking this rule will result in a Cheating violation."],
    violationId: "cheating",
  },
];

function OffenseLengthsTable({ offenses }) {
  const penalties = [
    ...offenses,
    ...Array(Math.max(0, 6 - offenses.length)).fill("-"),
  ];

  return (
    <TableContainer component={Paper} sx={{ overflowX: "auto", mt: 1, mb: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {OFFENSE_LABELS.map((label) => (
              <TableCell key={label} sx={headerCellSx} align="center">
                {label} Offense
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            {penalties.map((penalty, i) => (
              <TableCell key={i} sx={cellSx} align="center">
                {penalty}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function BulletList({ items }) {
  return (
    <List
      dense
      disablePadding
      sx={{
        listStyleType: "disc",
        pl: 2,
        "& .MuiListItem-root": { display: "list-item" },
      }}
    >
      {items.map((item, j) => (
        <ListItem key={j} disablePadding sx={{ py: 0.25 }}>
          <ListItemText
            primary={item}
            primaryTypographyProps={{ variant: "body1" }}
          />
        </ListItem>
      ))}
    </List>
  );
}

function RulesContent({ violationMap }) {
  return (
    <>
      {RULES_SECTIONS.map((section, index) => {
        if (section.type === "intro") {
          return (
            <Box key={index} sx={{ mb: 3 }}>
              {section.paragraphs.map((p, i) => (
                <Typography key={i} variant="body1" paragraph>
                  {p}
                </Typography>
              ))}
              {section.bullets && <BulletList items={section.bullets} />}
              {section.afterBullets?.map((p, i) => (
                <Typography key={`after-${i}`} variant="body1" paragraph sx={{ mt: 2 }}>
                  {p}
                </Typography>
              ))}
            </Box>
          );
        }

        if (section.type === "section") {
          return (
            <Typography
              key={index}
              variant="h3"
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              {section.title}
            </Typography>
          );
        }

        const violation = section.violationId
          ? violationMap[section.violationId]
          : null;

        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ textDecoration: "underline" }}
            >
              {section.title}
            </Typography>
            {section.paragraphs?.map((p, i) => (
              <Typography key={i} variant="body1" paragraph>
                {p}
              </Typography>
            ))}
            {section.bulletsIntro && (
              <Typography variant="body1" paragraph>
                {section.bulletsIntro}
              </Typography>
            )}
            {section.bullets && <BulletList items={section.bullets} />}
            {section.closing?.map((p, i) => (
              <Typography key={`close-${i}`} variant="body1" paragraph sx={{ mt: 1 }}>
                {p}
              </Typography>
            ))}
            {violation?.offenses && (
              <OffenseLengthsTable offenses={violation.offenses} />
            )}
          </Box>
        );
      })}
    </>
  );
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rules-tabpanel-${index}`}
      aria-labelledby={`rules-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Rules() {
  const { violationDefinitions, loading } = useViolations();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    document.title = "Rules | UltiMafia";
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return null;
  }

  const violationMap = violationDefinitions.reduce((acc, violation) => {
    acc[violation.id] = violation;
    return acc;
  }, {});

  return (
    <>
      <Typography variant="h2" gutterBottom>
        UltiMafia Rules of Conduct
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Last Updated: June 2, 2026
      </Typography>

      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Rules" />
        <Tab label="Filing an Appeal" />
        <Tab label="Other Policies" />
      </Tabs>

      <TabPanel value={selectedTab} index={0}>
        <RulesContent violationMap={violationMap} />
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Typography variant="h3" gutterBottom>
          Filing an Appeal
        </Typography>
        <Typography variant="body1" paragraph>
          If you believe that a violation on your record is in error, you may
          file an appeal. Navigate to your profile page and view
          your Rap Sheet. Click on any violation to view
          its details and file an appeal directly. Please provide a detailed
          explanation for why you believe the violation should be removed from
          your record. Your appeal will be reviewed by moderators, and you will
          be notified of the decision.
        </Typography>
        <Typography variant="body2" paragraph>
          You can only appeal reports that resulted in violations. Reports
          that were dismissed cannot be appealed. If you
          already have a pending appeal for a violation, you must wait for it
          to be reviewed before filing another appeal for the same violation.
        </Typography>
        <Typography variant="body2" paragraph>
          Please note that a violation can only be appealed once. Please include
          as much detail and evidence that you can provide as low-effort appeals
          will not be taken seriously by the team and could result in a dismissal
          if detail is poor or lacking.
        </Typography>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Typography variant="h3" gutterBottom>
          Other Policies
        </Typography>

        <Typography
          variant="h4"
          gutterBottom
          sx={{ textDecoration: "underline", mt: 2 }}
        >
          Abetting
        </Typography>
        <Typography variant="body1" paragraph>
          Encouraging or facilitating other users in violating game rules,
          including ban evasion or not informing admins of banned user activity. This includes, but is
          not limited to, urging others to engage in game-related abandonment,
          spam, cheat, or otherwise break established rules whether community
          related or game related.
        </Typography>
        <Typography variant="body1" paragraph>
          Users who support or enable rule violations will be held to a standard
          similar to the severity of the rule encouraged to be broken.
        </Typography>

        <Typography
          variant="h4"
          gutterBottom
          sx={{ textDecoration: "underline", mt: 2 }}
        >
          Hydra Accounts
        </Typography>
        <Typography variant="body1" paragraph>
          Accounts wherein two or more users share a single account are
          permitted, provided that admins are notified and approve of the
          account sharing. The account must exist for the express purpose of
          being shared; a hydra is not the same as a user inviting another user
          to play on their personal account. It is required to announce which
          user is currently on the account when joining a pregame, and the
          involved users may not chat on-site or off-site when the account is
          in a game.
        </Typography>
      </TabPanel>
    </>
  );
}
