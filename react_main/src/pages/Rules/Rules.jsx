import React, { useEffect } from "react";
import { makeStyles } from "@mui/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import "../../css/rules.css";

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
    "Spam",
    "Warning",
    "1 day",
    "3 days",
    "7 days",
    "1 month",
    "3 months"
  ),
  createData(
    "Inappropriate Behavior",
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
    "Warning",
    "1 hour",
    "12 hours",
    "24 hours",
    "3 days",
    "1 week"
  ),
  createData(
    "Abandonment",
    "Warning",
    "1 hour",
    "12 hours",
    "24 hours",
    "3 days",
    "1 week"
  ),
  createData(
    "Insuffient Participation",
    "Warning",
    "1 hour",
    "12 hours",
    "24 hours",
    "3 days",
    "1 week"
  ),
  createData(
    "Out-of-Game Information",
    "Warning",
    "1 hour",
    "12 hours",
    "24 hours",
    "3 days",
    "1 week"
  ),
  createData(
    "Exploits",
    "Warning",
    "1 hour",
    "12 hours",
    "24 hours",
    "3 days",
    "1 week"
  ),
  createData(
    "Cheating",
    "3 days",
    "1 week",
    "1 month",
    "3 months",
    "Permaban",
    "Permaban"
  ),
];

const useStyles = makeStyles({
  table: {
    minWidth: 650,
    "& .MuiTableCell-root": {
      border: "solid black",
    },
  },
});

export default function Rules() {
  const classes = useStyles();
  useEffect(() => {
    document.title = "Rules | UltiMafia";
  }, []);

  return (
    <div className="span-panel main center">
      <h1>UltiMafia Rules of Conduct</h1>
      <p>
        Please familiarize yourself with the rules of the site as well as the
        lengths for earned violations listed at the bottom of the page. Failure
        to comply with the rules will result in violations issued by the admins.
        The admins reserve the right to issue ban lengths for violations that
        may be longer than usual, at their discretion. Please note that there
        will be consequences for evading ban lengths.
      </p>
      <h2>Community Violations</h2>
      <p>
        Violating these rules will earn you bans from the entire site, including
        games, forum, as well as the Discord server.
      </p>
      <h3>Personal Attacks & Harassment (PA)</h3>
      <p>
        Repeatedly targeting a user for antagonism or harassment that doesn't
        meet the level of breaking other rules. Note: Victims of harassment are
        not required to ask for the behavior to stop for it to be considered
        harassment.
      </p>
      <h3>Spam</h3>
      <p>Excessive posting of forum topics, comments, or in chat rooms.</p>
      <h3>Inappropriate Behavior (IB)</h3>
      <p>
        Bigotry (racism, sexism, LGBTQ+ hate, etc.), bypassing language filters,
        sexually explicit or obscene content.
      </p>
      <h3>Outing of Personal Information (OPI)</h3>
      <p>Revealing personal information of a user (with or without consent).</p>
      <h3>Impersonation</h3>
      <p>
        Pretending to be another user, such as creating a similar looking
        username with associated bio or claiming to be a user in earnest with
        intent to defame.
      </p>
      <h3>Illegal Content & Activity (IC)</h3>
      <p>
        Posting or linking to illegal or potentially illegal content,
        inappropriate behavior with a minor.
      </p>
      <h2>Game-Related Violations</h2>
      <p>
        These violations will only earn you bans from ranked and competitive
        games; you will be able to access other games and the rest of the site.
      </p>
      <h3>Gamethrowing</h3>
      <p>
        Intentionally not playing toward your win condition. Also deliberately
        using gambits or tactics that have no reasonable chance of success.
      </p>
      <h3>Game-Related Abandonment (GRA)</h3>
      <p>Leaving the game or getting kicked from the game due to inactivity.</p>
      <h3>Insufficient Participation (ISP)</h3>
      <p>Not engaging in the game sufficiently; lurking.</p>
      <h3>Outside of Game Information (OGI)</h3>
      <p>
        Using anything from outside the game to influence behavior in the game.
        Includes communication other than those provided by the mechanics of the
        game, threats of retaliation outside the game (including threats of
        reporting), and using verbatim copy/pasting of system messages.
      </p>
      <h3>Exploits</h3>
      <p>
        Using any bug or glitch to gain an advantage and not reporting it to the
        admins or developers to be patched.
      </p>
      <h3>Cheating</h3>
      <p>
        Cheating, i.e. multi accounting, discussing game information outside of
        a game, etc. Includes using exploits as detailed above.
      </p>
      <h2>Violation Lengths</h2>
      <p>
        After serving the ban length for an offense, the violation will remain
        on one's record for three months starting from the day that the ban was
        first issued.
      </p>
      <TableContainer component={Paper}>
        <Table
          className={classes.table}
          sx={{ minWidth: 650 }}
          size="small"
          aria-label="a dense table"
        >
          <TableHead>
            <TableRow>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
              >
                Violation
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
                align="right"
              >
                1st&nbsp;Offense
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
                align="right"
              >
                2nd&nbsp;Offense
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
                align="right"
              >
                3rd&nbsp;Offense
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
                align="right"
              >
                4th&nbsp;Offense
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
                align="right"
              >
                5th&nbsp;Offense
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#333333",
                  color: "white",
                }}
                align="right"
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
                  style={{ backgroundColor: "#333333", color: "white" }}
                  component="th"
                  scope="row"
                >
                  {row.name}
                </TableCell>
                <TableCell
                  style={{ backgroundColor: "darkred", color: "white" }}
                  align="center"
                >
                  {row.firstoffense}
                </TableCell>
                <TableCell
                  style={{ backgroundColor: "darkred", color: "white" }}
                  align="center"
                >
                  {row.secondoffense}
                </TableCell>
                <TableCell
                  style={{ backgroundColor: "darkred", color: "white" }}
                  align="center"
                >
                  {row.thirdoffense}
                </TableCell>
                <TableCell
                  style={{ backgroundColor: "darkred", color: "white" }}
                  align="center"
                >
                  {row.fourthoffense}
                </TableCell>
                <TableCell
                  style={{ backgroundColor: "darkred", color: "white" }}
                  align="center"
                >
                  {row.fifthoffense}
                </TableCell>
                <TableCell
                  style={{ backgroundColor: "darkred", color: "white" }}
                  align="center"
                >
                  {row.sixthoffense}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
