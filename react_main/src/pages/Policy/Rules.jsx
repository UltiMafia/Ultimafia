import React, { useEffect } from 'react';
import { useTheme } from '@mui/styles';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

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
  createData('Personal Attacks', '1 day', '3 days', '3 weeks', '6 months', 'Permaban', 'Permaban'),
  createData('Spam', 'Warning', '1 day', '3 days', '7 days', '1 month', '3 months'),
  createData('Inappropriate Behavior', '1 day', '3 days', '3 weeks', '6 months', 'Permaban', 'Permaban'),
  createData('Outing of Personal Information', '6 months', 'Permaban', 'Permaban', 'Permaban', 'Permaban', 'Permaban'),
  createData('Impersonation', '3 months', '6 months', 'Permaban', 'Permaban', 'Permaban', 'Permaban'),
  createData('Illegal Content', 'Permaban', 'Permaban', 'Permaban', 'Permaban', 'Permaban', 'Permaban'),
  createData('Gamethrowing', '1 hour', '12 hours', '24 hours', '3 days', '1 week', '1 month'),
  createData('Abandonment', '1 hour', '12 hours', '24 hours', '3 days', '1 week', '1 month'),
  createData('Insufficient Participation', '1 hour', '12 hours', '24 hours', '3 days', '1 week', '1 month'),
  createData('Out-of-Game Information', '1 hour', '12 hours', '24 hours', '3 days', '1 week', '1 month'),
  createData('Exploits', '1 hour', '12 hours', '24 hours', '3 days', '1 week', '1 month'),
  createData('Cheating', '1 week', '1 month', '3 months', 'Permaban', 'Permaban', 'Permaban'),
];

export default function Rules() {
  const theme = useTheme();

  useEffect(() => {
    document.title = 'Rules | UltiMafia';
  }, []);

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      <Card variant="outlined" sx={{ padding: theme.spacing(3), textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          UltiMafia Rules of Conduct
        </Typography>
        <Typography variant="body1" paragraph>
          Please familiarize yourself with the rules of the site as well as the lengths for earned violations listed at the bottom of the page. Failure to comply with the rules will result in violations issued by the admins. The admins reserve the right to issue ban lengths for violations that may be longer than usual, at their discretion. Please note that there will be consequences for evading ban lengths.
        </Typography>
        <Typography variant="h5" gutterBottom>
          Community Violations
        </Typography>
        <Typography variant="body1" paragraph>
          Violating these rules will earn you bans from the entire site, including games, forum, as well as the Discord server.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Personal Attacks & Harassment (PA)
        </Typography>
        <Typography variant="body1" paragraph>
          Repeatedly targeting a user for antagonism or harassment that doesn't meet the level of breaking other rules. Note: Victims of harassment are not required to ask for the behavior to stop for it to be considered harassment.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Spam
        </Typography>
        <Typography variant="body1" paragraph>
          Excessive posting of forum topics, comments, or in chat rooms.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Inappropriate Behavior (IB)
        </Typography>
        <Typography variant="body1" paragraph>
          Bigotry (racism, sexism, LGBTQ+ hate, etc.), bypassing language filters, sexually explicit or obscene content.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Outing of Personal Information (OPI)
        </Typography>
        <Typography variant="body1" paragraph>
          Revealing personal information of a user (with or without consent).
        </Typography>
        <Typography variant="h6" gutterBottom>
          Impersonation
        </Typography>
        <Typography variant="body1" paragraph>
          Pretending to be another user, such as creating a similar looking username with associated bio or claiming to be a user in earnest with intent to defame.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Illegal Content & Activity (IC)
        </Typography>
        <Typography variant="body1" paragraph>
          Posting or linking to illegal or potentially illegal content, inappropriate behavior with a minor.
        </Typography>
        <Typography variant="h5" gutterBottom>
          Game-Related Violations
        </Typography>
        <Typography variant="body1" paragraph>
          These violations will only earn you bans from ranked and competitive games; you will be able to access other games and the rest of the site.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Gamethrowing
        </Typography>
        <Typography variant="body1" paragraph>
          Intentionally not playing toward your win condition. Also deliberately using gambits or tactics that have no reasonable chance of success.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Game-Related Abandonment (GRA)
        </Typography>
        <Typography variant="body1" paragraph>
          Leaving the game or getting kicked from the game due to inactivity.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Insufficient Participation (ISP)
        </Typography>
        <Typography variant="body1" paragraph>
          Not engaging in the game sufficiently; lurking.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Outside of Game Information (OGI)
        </Typography>
        <Typography variant="body1" paragraph>
          Using anything from outside the game to influence behavior in the game. Includes communication other than those provided by the mechanics of the game, threats of retaliation outside the game (including threats of reporting), and using verbatim copy/pasting of system messages.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Exploits
        </Typography>
        <Typography variant="body1" paragraph>
          Using any bug or glitch to gain an advantage and not reporting it to the admins or developers to be patched.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Cheating
        </Typography>
        <Typography variant="body1" paragraph>
          Cheating, i.e. multi accounting, discussing game information outside of a game, etc. Includes using exploits as detailed above.
        </Typography>
        <Typography variant="h5" gutterBottom>
          Violation Lengths
        </Typography>
        <Typography variant="body1" paragraph>
          After serving the ban length for an offense, the violation will remain on one's record for three months starting from the day that the ban was first issued.
        </Typography>
        <TableContainer component={Paper}>
          <Table aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  Violation
                </TableCell>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  1st&nbsp;Offense
                </TableCell>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  2nd&nbsp;Offense
                </TableCell>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  3rd&nbsp;Offense
                </TableCell>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  4th&nbsp;Offense
                </TableCell>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  5th&nbsp;Offense
                </TableCell>
                <TableCell style={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                  6th&nbsp;Offense
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': {} }}>
                  <TableCell style={{ backgroundColor: theme.palette.primary.background, color: theme.palette.text.main }} component="th" scope="row" align="center">
                    {row.name}
                  </TableCell>
                  <TableCell style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                    {row.firstoffense}
                  </TableCell>
                  <TableCell style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                    {row.secondoffense}
                  </TableCell>
                  <TableCell style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                    {row.thirdoffense}
                  </TableCell>
                  <TableCell style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                    {row.fourthoffense}
                  </TableCell>
                  <TableCell style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                    {row.fifthoffense}
                  </TableCell>
                  <TableCell style={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.main }} align="center">
                    {row.sixthoffense}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}