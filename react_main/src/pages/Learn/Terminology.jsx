import React, { useState, useEffect } from "react";
import "css/play.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { slangList } from "../../constants/slangList";
import { commandList } from "../../constants/commandList";
import { AchievementSearch } from "../../components/Achievements";

export default function Terminology(props) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    document.title = "Learn Terminology | UltiMafia";
  }, []);

  const commandTableRows = Object.keys(commandList)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((key) => {
    let { input, description } = commandList[key];

    return {
      term: key,
      input,
      description,
    };
  });

  const commandTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Command</TableCell>
            <TableCell>Input</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {commandTableRows.map((row) => (
            <TableRow
              key={row.term}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row" align="center">
                {row.term}
              </TableCell>
              <TableCell align="center">{row.input}</TableCell>
              <TableCell align="center">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const slangTableRows = Object.keys(slangList)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .filter((key) => slangList[key] != null)
    .map((key) => {
    let { definition, emoji } = slangList[key];
    if (Array.isArray(emoji)) {
      emoji = emoji.join(", ");
    }

    return {
      term: key,
      definition,
      emoji,
    };
  });

  const slangTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Term</TableCell>
            <TableCell>Definition</TableCell>
            <TableCell>Emote</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {slangTableRows.map((row) => (
            <TableRow
              key={row.term}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row" align="center">
                {row.term}
              </TableCell>
              <TableCell align="center">{row.definition}</TableCell>
              <TableCell align="center">{row.emoji}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Typography variant="h2" gutterBottom>
        Terminology
      </Typography>
      <Typography variant="body1" paragraph>
        The game features a comprehensive list of terms and chat commands.
        Understanding these commands and terms is crucial for mastering the
        game's mechanics and strategies. To improve the definitions or add new
        ones, we encourage you to get involved through our Discord or Github
        Repo.
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Terminology sections">
        <Tab label="Achievements" id="term-tab-0" aria-controls="term-panel-0" />
        <Tab label="Slang" id="term-tab-1" aria-controls="term-panel-1" />
        <Tab label="Commands" id="term-tab-2" aria-controls="term-panel-2" />
      </Tabs>
      <Box role="tabpanel" id="term-panel-0" aria-labelledby="term-tab-0" hidden={tab !== 0}>
        {tab === 0 && (
          <Box sx={{ pt: 2 }}>
            <AchievementSearch />
          </Box>
        )}
      </Box>
      <Box role="tabpanel" id="term-panel-1" aria-labelledby="term-tab-1" hidden={tab !== 1}>
        {tab === 1 && (
          <Box sx={{ pt: 2 }} className="paragraph">
            <Typography paragraph>
              Below is a list of terms that are automatically detected during
              gameplay.
            </Typography>
            {slangTable}
          </Box>
        )}
      </Box>
      <Box role="tabpanel" id="term-panel-2" aria-labelledby="term-tab-2" hidden={tab !== 2}>
        {tab === 2 && (
          <Box sx={{ pt: 2 }} className="paragraph">
            <Typography paragraph>
              Below is a list of chat commands able to be used in games.
            </Typography>
            {commandTable}
          </Box>
        )}
      </Box>
    </>
  );
}
