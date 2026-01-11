import React, { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import { violationDefinitions } from "../../constants/violations";

export default function Rules() {
  const theme = useTheme();

  useEffect(() => {
    document.title = "Rules | UltiMafia";
  }, []);

  const communityRules = violationDefinitions.filter((r) => r.category === "Community");
  const gameRules = violationDefinitions.filter((r) => r.category === "Game");

  return (
    <>
      <Typography variant="h2" gutterBottom>
        UltiMafia Rules of Conduct
      </Typography>
      <Typography variant="body1">
        Please familiarize yourself with the rules of the website as well as the
        lengths for earned violations listed at the bottom of the page. Failure
        to comply with the rules will result in violations issued by the admins.
        The admins reserve the right to issue ban lengths for violations that
        may be longer than usual at their discretion. Attempting to or
        successfully evading a ban in any way will also incur penalties.
      </Typography>

      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary>
          <Typography variant="h3">Community Violations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1">
            These are violations relating to personal and community conduct.
            Receiving any of these violations will lead to bans from the
            entirety of the site (including games, forums, chat, and the Discord
            server).
          </Typography>
          {communityRules.map((rule) => (
            <div key={rule.name} style={{ marginBottom: "1rem" }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ textDecoration: "underline" }}
              >
                {rule.name}
              </Typography>
              <Typography variant="body1">{rule.description}</Typography>
            </div>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Game-Related Violations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1">
            These violations will only earn you bans from ranked and competitive
            games; you will be able to access other games and the rest of the
            site.
          </Typography>
          {gameRules.map((rule) => (
            <div key={rule.name} style={{ marginBottom: "1rem" }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ textDecoration: "underline" }}
              >
                {rule.name}
              </Typography>
              <Typography variant="body1">{rule.description}</Typography>
            </div>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Violation Lengths</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1">
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
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Filing an Appeal</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            If you believe that a violation, past or present, is in error,
            please file an appeal. You may use the Report page to file your
            appeal like you would any other report, simply enter your own name
            in the Username field. Please provide a detailed description for why
            you believe the violation is in error and what alternative
            verdict—if any—you find acceptable. An admin will contact you to
            inform you of the decision.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
