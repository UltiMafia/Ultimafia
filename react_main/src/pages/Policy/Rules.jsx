import React, { useEffect } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

function createData(
  name,
  firstoffense,
  secondoffense,
  thirdoffense,
  fourthoffense,
  fifthoffense,
  sixthoffense
) {
  return {
    name,
    firstoffense,
    secondoffense,
    thirdoffense,
    fourthoffense,
    fifthoffense,
    sixthoffense,
  };
}

const rows = [
  createData(
    "Personal Attacks",
    "1 day",
    "3 days",
    "3 weeks",
    "6 months",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Intolerance",
    "1 day",
    "3 days",
    "3 weeks",
    "6 months",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Adult Content",
    "1 day",
    "3 days",
    "3 weeks",
    "6 months",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Instigation",
    "1 day",
    "3 days",
    "3 weeks",
    "6 months",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Hazing",
    "1 day",
    "3 days",
    "3 weeks",
    "6 months",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Outing of Personal Information",
    "6 months",
    "Permaban",
    "Permaban",
    "Permaban",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Coercion",
    "1 day",
    "3 days",
    "3 weeks",
    "6 months",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Impersonation",
    "3 months",
    "6 months",
    "Permaban",
    "Permaban",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Illegal Content",
    "Permaban",
    "Permaban",
    "Permaban",
    "Permaban",
    "Permaban",
    "Permaban"
  ),
  createData(
    "Gamethrowing",
    "1 day",
    "1 week",
    "3 weeks",
    "Loss of privilege",
    "-",
    "-"
  ),
  createData(
    "Abandonment",
    "1 day",
    "1 week",
    "3 weeks",
    "Loss of privilege",
    "-",
    "-"
  ),
  createData(
    "Insufficient Participation",
    "1 day",
    "1 week",
    "3 weeks",
    "Loss of privilege",
    "-",
    "-"
  ),
  createData(
    "Out-of-Game Information",
    "1 day",
    "1 week",
    "3 weeks",
    "Loss of privilege",
    "-",
    "-"
  ),
  createData(
    "Exploits",
    "1 day",
    "1 week",
    "3 weeks",
    "Loss of privilege",
    "-",
    "-"
  ),
  createData(
    "Cheating",
    "1 day",
    "1 week",
    "3 weeks",
    "Loss of privilege",
    "-",
    "-"
  ),
];

export default function Rules() {
  const theme = useTheme();

  useEffect(() => {
    document.title = "Rules | UltiMafia";
  }, []);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        UltiMafia Rules of Conduct
      </Typography>
      <Typography variant="body1" paragraph>
        Please familiarize yourself with the rules of the website as well as the
        lengths for earned violations listed at the bottom of the page. Failure
        to comply with the rules will result in violations issued by the admins.
        The admins reserve the right to issue ban lengths for violations that
        may be longer than usual at their discretion. Attempting to or
        successfully evading a ban in any way will also incur penalties.
      </Typography>
      <Accordion>
        <AccordionSummary id="community-violations-header">
          <Typography variant="h5">Community Violations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            These are violations relating to personal and community conduct.
            Receiving any of these violations will lead to bans from the
            entirety of the site (including games, forums, chat, and the Discord
            server).
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Personal Attacks & Harassment (PA)
          </Typography>
          <Typography variant="body1" paragraph>
            Repeatedly antagonizing or harassing a user or multiple users in a
            specific, targeted manner. Note: Victims of harassment are not
            required to ask for the behavior to stop for it to be considered
            harassment.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Intolerance
          </Typography>
          <Typography variant="body1" paragraph>
            Any disrespectful behavior on the basis of group identity. This
            includes bigotry of any kind (including but not limited to: racism,
            homophobia, transphobia, misogyny, etc.), bypassing slur filters,
            and genocide denial.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Adult Content
          </Typography>
          <Typography variant="body1" paragraph>
            Graphic descriptions of adult behavior, including explicit
            discussion of sex acts, consumption of illicit substances, or
            descriptions of real violence. Restrict oneself to a "13 and up"
            mindset.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Instigation
          </Typography>
          <Typography variant="body1" paragraph>
            Intentionally baiting conflict between users, including concern
            trolling, causing a mass argument in public spaces, and
            disingenuously encouraging drama. The report function exists for a
            reason.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Hazing
          </Typography>
          <Typography variant="body1" paragraph>
            Discriminating against or otherwise mistreating users on new
            accounts. This includes policy-voting, accusing a new account of
            existing to break game rules, and otherwise promoting an anti-growth
            mindset.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Outing of Personal Information (OPI)
          </Typography>
          <Typography variant="body1" paragraph>
            Revealing the personal or identifying information of other users
            without their consent (including their names, locations, age, etc.).
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Coercion
          </Typography>
          <Typography variant="body1" paragraph>
            Threatening or blackmailing users with social consequences,
            especially those with off-site ramifications.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Impersonation
          </Typography>
          <Typography variant="body1" paragraph>
            Pretending to be another user with intent to defame or frame them
            for misbehavior. Examples include creating an account with a similar
            username or outright claiming to be another user with malicious
            intent.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Illegal Content & Activity (IC)
          </Typography>
          <Typography variant="body1" paragraph>
            Posting, linking to, or participating in any sort of illegal or
            potentially illegal activity (such as inappropriate conduct with a
            minor). Law enforcement will be notified whenever possible.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary id="game-violations-header">
          <Typography variant="h5">Game-Related Violations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            These violations will only earn you bans from ranked and competitive
            games; you will be able to access other games and the rest of the
            site.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Game Throwing
          </Typography>
          <Typography variant="body1" paragraph>
            Intentionally not playing toward your win condition (for example by
            outing partners as mafia). Deliberately using gambits or tactics
            that have no reasonable chance of success is also considered game
            throwing.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Game-Related Abandonment (GRA)
          </Typography>
          <Typography variant="body1" paragraph>
            Leaving a ranked or competitive game after the game has started.
            Deliberately going AFK in order to ensure that the game becomes
            unranked also qualifies as GRA.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Insufficient Participation (ISP)
          </Typography>
          <Typography variant="body1" paragraph>
            Not participating actively or consistently in a game.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Outside of Game Information (OGI)
          </Typography>
          <Typography variant="body1" paragraph>
            Using anything from outside the game to influence behavior in the
            game. Includes communication other than those provided by the
            mechanics of the game, threats of retaliation outside the game
            (including threats of reporting), and copy/pasting or screenshotting
            system messages.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Exploits
          </Typography>
          <Typography variant="body1" paragraph>
            Intentionally taking advantage of bugs and glitches in order to give
            yourself/your team an unfair edge. Not reporting a bug to the admins
            or developers for the same purpose also applies.
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ textDecoration: "underline" }}
          >
            Cheating
          </Typography>
          <Typography variant="body1" paragraph>
            Any form of gameplay manipulation which allows yourself an unfair
            advantage that other players don't have. This can consist of
            multi-accounting, discussing game information with other players
            outside of the game itself (e.g. via Discord or another outside chat
            client), or using exploits as detailed above.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary id="violation-lengths-header">
          <Typography variant="h5">Violation Lengths</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            After serving the ban length for an offense, the violation will
            remain on one's record for three months starting from the day that
            the ban was first issued.
          </Typography>
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    Violation
                  </TableCell>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    1st&nbsp;Offense
                  </TableCell>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    2nd&nbsp;Offense
                  </TableCell>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    3rd&nbsp;Offense
                  </TableCell>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    4th&nbsp;Offense
                  </TableCell>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    5th&nbsp;Offense
                  </TableCell>
                  <TableCell
                    style={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.main,
                    }}
                    align="center"
                  >
                    6th&nbsp;Offense
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.name}
                    sx={{ "&:last-child td, &:last-child th": {} }}
                  >
                    <TableCell
                      style={{
                        backgroundColor: "var(--scheme-color-sec)",
                      }}
                      component="th"
                      scope="row"
                      align="center"
                    >
                      {row.name}
                    </TableCell>
                    <TableCell
                      style={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.main,
                      }}
                      align="center"
                    >
                      {row.firstoffense}
                    </TableCell>
                    <TableCell
                      style={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.main,
                      }}
                      align="center"
                    >
                      {row.secondoffense}
                    </TableCell>
                    <TableCell
                      style={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.main,
                      }}
                      align="center"
                    >
                      {row.thirdoffense}
                    </TableCell>
                    <TableCell
                      style={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.main,
                      }}
                      align="center"
                    >
                      {row.fourthoffense}
                    </TableCell>
                    <TableCell
                      style={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.main,
                      }}
                      align="center"
                    >
                      {row.fifthoffense}
                    </TableCell>
                    <TableCell
                      style={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.text.main,
                      }}
                      align="center"
                    >
                      {row.sixthoffense}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary id="violation-lengths-header">
          <Typography variant="h5">Filing an Appeal</Typography>
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
