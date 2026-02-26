import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
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

function RuleDescription({ description }) {
  if (!description) return null;
  if (typeof description === "string") {
    return <Typography variant="body1">{description}</Typography>;
  }
  if (!Array.isArray(description)) return null;
  return (
    <>
      {description.map((block, i) =>
        block.type === "paragraph" ? (
          <Typography key={i} variant="body1" paragraph>
            {block.content}
          </Typography>
        ) : block.type === "list" ? (
          <List key={i} dense disablePadding sx={{ listStyleType: "disc", pl: 2, "& .MuiListItem-root": { display: "list-item" } }}>
            {block.items.map((item, j) => (
              <ListItem key={j} disablePadding sx={{ py: 0.25 }}>
                <ListItemText primary={item} primaryTypographyProps={{ variant: "body1" }} />
              </ListItem>
            ))}
          </List>
        ) : null
      )}
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
  const theme = useTheme();
  const { violationDefinitions, loading } = useViolations();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    document.title = "Rules | UltiMafia";
  }, []);

  const communityRules = violationDefinitions.filter((r) => r.category === "Community");
  const gameRules = violationDefinitions.filter((r) => r.category === "Game");

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <Typography variant="h2" gutterBottom>
        UltiMafia Rules of Conduct
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Last Updated: February 25, 2026
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider"}}>
        <Tabs 
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
          }}
          >
          <Tab label="Community Violations" />
          <Tab label="Game-Related Violations" />
          <Tab label="Violation Lengths" />
          <Tab label="Filing an Appeal" />
          <Tab label="Other Policies" />
        </Tabs>
      </Box>

      <TabPanel value={selectedTab} index={0}>
        <Typography variant="h3" gutterBottom>
          Community Violations
        </Typography>
        <Typography variant="body1" paragraph>
          These are violations relating to personal and community conduct.
          Receiving any of these violations will lead to bans from the
          entirety of the site (including games, forums, chat, and the Discord
          server).
        </Typography>
        {communityRules.map((rule) => (
          <Box key={rule.name} sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ textDecoration: "underline" }}
            >
              {rule.name}
            </Typography>
            <RuleDescription description={rule.description} />
          </Box>
        ))}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Typography variant="h3" gutterBottom>
          Game-Related Violations
        </Typography>
        <Typography variant="body1" paragraph>
          These violations will only earn you bans from ranked and competitive
          games; you will be able to access other games and the rest of the
          site. With the exception of cheating, all game-related violations are 
          preceded by one warning.
        </Typography>
        {gameRules.map((rule) => (
          <Box key={rule.name} sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ textDecoration: "underline" }}
            >
              {rule.name}
            </Typography>
            <RuleDescription description={rule.description} />
          </Box>
        ))}
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Typography variant="h3" gutterBottom>
          Violation Lengths
        </Typography>
        <Typography variant="body1" paragraph>
          After serving the ban length for an offense, the violation will
          remain on one's record for three months starting from the day that
          the ban was first issued.
        </Typography>
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "var(--scheme-color-sec)",
                  }}
                  align="center"
                >
                  Violation
                </TableCell>
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
                  return (
                    <TableCell
                      key={n}
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "var(--scheme-color-sec)",
                      }}
                      align="center"
                    >
                      {n}{suffix} Offense
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {violationDefinitions.map((rule) => (
                <TableRow key={rule.name}>
                  <TableCell
                    sx={{
                      backgroundColor: "var(--scheme-color-sec)",
                      fontWeight: 600,
                    }}
                    align="center"
                  >
                    {rule.name}
                  </TableCell>
                  {[...rule.offenses, ...Array(Math.max(0, 6 - rule.offenses.length)).fill("-")].map((penalty, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        backgroundColor: "var(--scheme-color-sec)",
                      }}
                      align="center"
                    >
                      {penalty}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={selectedTab} index={3}>
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
          Note: You can only appeal reports that resulted in violations. Reports
          that were dismissed cannot be appealed. If you
          already have a pending appeal for a violation, you must wait for it
          to be reviewed before filing another appeal for the same violation.
        </Typography>
      </TabPanel>

      <TabPanel value={selectedTab} index={4}>
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
