import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Slider,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { getAlignmentColor } from "components/Setup";

// Constants mirror modules/fortunePoints.js. Displayed to users as read-only
// reference values — not editable in the calculator.
const K = 120;
const JOINT_DAMP_MAJOR = 0.9;
const JOINT_DAMP_INDEPENDENT = 0.7;
const ANCHOR_WR = 0.1;
const ANCHOR_PAYOUT = 80;
const INDEPENDENT_CAP = 120;
const MIN_FORTUNE_GAMES = 5;
const LOW_SAMPLE_PAYOUT = 60;

const MAJOR_NAMES = ["Village", "Mafia", "RedMafia", "Cult"];

// Canonical site palette via getAlignmentColor; RedMafia gets a red accent
// since it has no dedicated alignment color and its name signals the hue.
const FACTION_COLORS = {
  Village: getAlignmentColor("Village"),
  Mafia: getAlignmentColor("Mafia"),
  RedMafia: "#e53935",
  Cult: getAlignmentColor("Cult"),
};
const INDEPENDENT_COLOR = getAlignmentColor("Independent");
const MAJOR_GROUP_COLOR = getAlignmentColor("Village");

function factionColor(faction) {
  return FACTION_COLORS[faction.name] || INDEPENDENT_COLOR;
}

function colorForButton(name) {
  return FACTION_COLORS[name] || INDEPENDENT_COLOR;
}

function soloPayout(category, wrPercent) {
  const wr = wrPercent / 100;
  if (category === "major") {
    return (1 - wr) * K;
  }
  const raw = wr > 0 ? Math.sqrt(ANCHOR_WR / wr) * ANCHOR_PAYOUT : Infinity;
  return Math.min(INDEPENDENT_CAP, raw);
}

function jointPayout(category, wrPercent) {
  const damp =
    category === "major" ? JOINT_DAMP_MAJOR : JOINT_DAMP_INDEPENDENT;
  return soloPayout(category, wrPercent) * damp;
}

function soloFormula(category, wrPercent) {
  const wr = wrPercent / 100;
  const wrStr = wr.toFixed(2);
  if (category === "major") {
    const result = Math.round((1 - wr) * K);
    return `(1 − ${wrStr}) × ${K} = ${result}`;
  }
  if (wr <= 0) {
    return `min(${INDEPENDENT_CAP}, √(${ANCHOR_WR} / 0) × ${ANCHOR_PAYOUT}) = ${INDEPENDENT_CAP}`;
  }
  const raw = Math.sqrt(ANCHOR_WR / wr) * ANCHOR_PAYOUT;
  if (raw >= INDEPENDENT_CAP) {
    return `min(${INDEPENDENT_CAP}, √(${ANCHOR_WR} / ${wrStr}) × ${ANCHOR_PAYOUT}) = ${INDEPENDENT_CAP}`;
  }
  return `√(${ANCHOR_WR} / ${wrStr}) × ${ANCHOR_PAYOUT} ≈ ${Math.round(raw)}`;
}

function jointFormula(category, wrPercent) {
  const solo = Math.round(soloPayout(category, wrPercent));
  const damp =
    category === "major" ? JOINT_DAMP_MAJOR : JOINT_DAMP_INDEPENDENT;
  const result = Math.round(soloPayout(category, wrPercent) * damp);
  return `${solo} × ${damp} = ${result}`;
}

function PayoutCell({ value, formula }) {
  return (
    <Tooltip title={formula} arrow placement="top">
      <Typography
        component="span"
        sx={{
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
          borderBottom: "1px dotted",
          borderColor: "text.secondary",
          cursor: "help",
        }}
      >
        {value}
      </Typography>
    </Tooltip>
  );
}

function FormulaBlock({ children }) {
  return (
    <Box
      component="code"
      sx={{
        display: "inline-block",
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: "action.hover",
        fontFamily: "monospace",
        fontSize: "0.95em",
      }}
    >
      {children}
    </Box>
  );
}

export function FortuneCalculatorContent() {
  const isPhone = useIsPhoneDevice();
  const [factions, setFactions] = useState([
    { id: 1, name: "Village", category: "major", wr: 50 },
    { id: 2, name: "Mafia", category: "major", wr: 50 },
  ]);
  const [nextId, setNextId] = useState(3);
  const [nextIndepNum, setNextIndepNum] = useState(1);

  const usedMajors = new Set(
    factions.filter((f) => f.category === "major").map((f) => f.name)
  );
  const availableMajors = MAJOR_NAMES.filter((m) => !usedMajors.has(m));

  const addMajor = (name) => {
    setFactions([
      ...factions,
      { id: nextId, name, category: "major", wr: 50 },
    ]);
    setNextId(nextId + 1);
  };

  const addIndependent = () => {
    setFactions([
      ...factions,
      {
        id: nextId,
        name: `Independent ${nextIndepNum}`,
        category: "independent",
        wr: 10,
      },
    ]);
    setNextId(nextId + 1);
    setNextIndepNum(nextIndepNum + 1);
  };

  const removeFaction = (id) => {
    setFactions(factions.filter((f) => f.id !== id));
  };

  const updateWR = (id, wr) => {
    setFactions(factions.map((f) => (f.id === id ? { ...f, wr } : f)));
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: isPhone ? "100%" : 900, mx: "auto" }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Calculator
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add the factions in your game and set each one's historical winrate.
          Hover a payout to see the formula with your values.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Note: setups with fewer than {MIN_FORTUNE_GAMES} ranked/competitive
          plays always pay a flat {LOW_SAMPLE_PAYOUT} fortune (solo or joint),
          ignoring winrate — small samples are too noisy to scale.
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
        >
          {availableMajors.map((name) => (
            <Button
              key={name}
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={() => addMajor(name)}
              sx={{
                color: colorForButton(name),
                borderColor: colorForButton(name),
                "&:hover": {
                  borderColor: colorForButton(name),
                  backgroundColor: `${colorForButton(name)}22`,
                },
              }}
            >
              {name}
            </Button>
          ))}
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={addIndependent}
            sx={{
              color: INDEPENDENT_COLOR,
              borderColor: INDEPENDENT_COLOR,
              "&:hover": {
                borderColor: INDEPENDENT_COLOR,
                backgroundColor: `${INDEPENDENT_COLOR}22`,
              },
            }}
          >
            Independent
          </Button>
        </Stack>

        {factions.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
            No factions yet — add one above to see its payout.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Faction</TableCell>
                  <TableCell sx={{ minWidth: isPhone ? 120 : 240 }}>
                    Winrate
                  </TableCell>
                  <TableCell align="center">Solo win</TableCell>
                  <TableCell align="center">Joint win</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {factions.map((f) => (
                  <TableRow
                    key={f.id}
                    sx={{
                      borderLeft: `4px solid ${factionColor(f)}`,
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ color: factionColor(f), fontWeight: 600 }}>
                        {f.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {f.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ minWidth: isPhone ? 100 : 200 }}
                      >
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={f.wr}
                          onChange={(_, v) => updateWR(f.id, v)}
                          size="small"
                          sx={{ flex: 1, color: factionColor(f) }}
                        />
                        <Typography
                          sx={{
                            minWidth: 40,
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {f.wr}%
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <PayoutCell
                        value={Math.round(soloPayout(f.category, f.wr))}
                        formula={soloFormula(f.category, f.wr)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <PayoutCell
                        value={Math.round(jointPayout(f.category, f.wr))}
                        formula={jointFormula(f.category, f.wr)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => removeFaction(f.id)}
                        aria-label={`remove ${f.name}`}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Constants
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ mt: 1, mb: 0.5, color: MAJOR_GROUP_COLOR, fontWeight: 700 }}
        >
          Major factions
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`Major base K = ${K}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: MAJOR_GROUP_COLOR, color: MAJOR_GROUP_COLOR }}
          />
          <Chip
            label={`Major joint damp = ${JOINT_DAMP_MAJOR}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: MAJOR_GROUP_COLOR, color: MAJOR_GROUP_COLOR }}
          />
        </Stack>
        <Typography
          variant="subtitle2"
          sx={{ mt: 2, mb: 0.5, color: INDEPENDENT_COLOR, fontWeight: 700 }}
        >
          Independent factions
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`Independent anchor WR = ${ANCHOR_WR * 100}%`}
            size="small"
            variant="outlined"
            sx={{ borderColor: INDEPENDENT_COLOR, color: INDEPENDENT_COLOR }}
          />
          <Chip
            label={`Independent anchor payout = ${ANCHOR_PAYOUT}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: INDEPENDENT_COLOR, color: INDEPENDENT_COLOR }}
          />
          <Chip
            label={`Independent cap = ${INDEPENDENT_CAP}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: INDEPENDENT_COLOR, color: INDEPENDENT_COLOR }}
          />
          <Chip
            label={`Independent joint damp = ${JOINT_DAMP_INDEPENDENT}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: INDEPENDENT_COLOR, color: INDEPENDENT_COLOR }}
          />
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          These are fixed values from the fortune module and cannot be changed here.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          How fortune is calculated
        </Typography>
        <Typography paragraph>
          Every winning faction earns fortune points. Losing factions earn 0 —
          misfortune has been scrapped.
        </Typography>

        <Typography
          variant="h6"
          sx={{ mt: 2, color: MAJOR_GROUP_COLOR }}
        >
          Major factions — Village, Mafia, RedMafia, Cult
        </Typography>
        <Stack spacing={0.5} sx={{ pl: 2 }}>
          <Typography>
            Solo win: <FormulaBlock>K × (1 − WR)</FormulaBlock>
          </Typography>
          <Typography>
            Joint win: <FormulaBlock>solo × 0.9</FormulaBlock>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example · Mafia at 40% WR winning solo →{" "}
            <FormulaBlock>(1 − 0.40) × 120 = 72</FormulaBlock>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example · Mafia at 40% WR joint-winning with Cult →{" "}
            <FormulaBlock>72 × 0.9 ≈ 65</FormulaBlock>
          </Typography>
        </Stack>

        <Typography
          variant="h6"
          sx={{ mt: 2, color: INDEPENDENT_COLOR }}
        >
          Independent factions — Jester, Serial Killer, etc.
        </Typography>
        <Stack spacing={0.5} sx={{ pl: 2 }}>
          <Typography>
            Solo win:{" "}
            <FormulaBlock>min(120, √(0.10 / WR) × 80)</FormulaBlock>
          </Typography>
          <Typography>
            Joint win: <FormulaBlock>solo × 0.7</FormulaBlock>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example · Jester at 10% WR (the anchor) →{" "}
            <FormulaBlock>√(0.10 / 0.10) × 80 = 80</FormulaBlock>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example · Jester at 5% WR → <FormulaBlock>√2 × 80 ≈ 113</FormulaBlock>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example · Jester at 1% WR → capped at{" "}
            <FormulaBlock>120</FormulaBlock>
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Joint wins are dampened because sharing the game is easier than
          winning alone. Lower historical winrate pays more — defying odds
          earns the bigger reward.
        </Typography>
      </Paper>
    </Stack>
  );
}
