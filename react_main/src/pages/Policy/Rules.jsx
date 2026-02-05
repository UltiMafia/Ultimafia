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
} from "@mui/material";
import { useViolations } from "../../hooks/useViolations";

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

      <Box sx={{ borderBottom: 1, borderColor: "divider"}}>
        <Tabs value={selectedTab} onChange={handleTabChange} aria-label="rules tabs">
          <Tab label="Community Violations" />
          <Tab label="Game-Related Violations" />
          <Tab label="Violation Lengths" />
          <Tab label="Filing an Appeal" />
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
            <Typography variant="body1">{rule.description}</Typography>
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
          site.
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
            <Typography variant="body1">{rule.description}</Typography>
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
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <TableCell
                    key={n}
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "var(--scheme-color-sec)",
                    }}
                    align="center"
                  >
                    {n}st Offense
                  </TableCell>
                ))}
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
                  {rule.offenses.map((penalty, i) => (
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
    </>
  );
}
