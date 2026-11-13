import React, { useState, useEffect } from "react";
import { UiPageHeader, UiTabs, UiTab, UiTable } from "components/ui";
import "css/play.css";
import { Box, Typography, TextField } from "@mui/material";

import { slangList } from "../../constants/slangList";
import { commandList } from "../../constants/commandList";

const commandColumns = [
  { key: "term", label: "Command", code: true, nowrap: true },
  { key: "input", label: "Input", code: true, nowrap: true },
  { key: "description", label: "Description" },
];

const slangColumns = [
  { key: "term", label: "Term", nowrap: true },
  { key: "definition", label: "Definition" },
  { key: "emoji", label: "Emote", nowrap: true },
];

export default function LearnGlossary(props) {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const matches = (...values) => values.some(value => String(value || "").toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    document.title = "Learn Glossary | UltiMafia";
  }, []);

  const commandTableRows = Object.keys(commandList)
    .filter(key => matches(key, commandList[key].input, commandList[key].description))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((key) => {
      let { input, description } = commandList[key];
      return {
        term: key,
        input,
        description,
      };
    });

  const slangTableRows = Object.keys(slangList)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .filter((key) => slangList[key] != null)
    .filter(key => matches(key, slangList[key].definition))
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

  return (
    <section className="glossary-page">
      <UiPageHeader title="Glossary" description="Search definitions and chat commands." />
      <TextField
        className="reference-search"
        type="search"
        placeholder="Search terms and commands..."
        value={query}
        onChange={event => setQuery(event.target.value)}
        size="small"
      />
      <UiTabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Terminology sections">
        <UiTab label="Slang" id="term-tab-0" aria-controls="term-panel-0" />
        <UiTab label="Commands" id="term-tab-1" aria-controls="term-panel-1" />
      </UiTabs>
      <Typography variant="body2" color="text.secondary" role="status" sx={{ my: 2 }}>
        {(tab === 0 ? slangTableRows : commandTableRows).length} results
        {query.trim() ? ` for “${query.trim()}”` : ""}
      </Typography>
      <Box role="tabpanel" id="term-panel-0" aria-labelledby="term-tab-0" hidden={tab !== 0}>
        {tab === 0 && (
          <Box sx={{ pt: 1 }}>
            <Typography paragraph color="text.secondary">
              Below is a list of terms that are automatically detected during gameplay.
            </Typography>
            <UiTable
              label="Game terminology"
              columns={slangColumns}
              rows={slangTableRows}
              rowKey="term"
              emptyMessage="No matching terms found."
            />
          </Box>
        )}
      </Box>
      <Box role="tabpanel" id="term-panel-1" aria-labelledby="term-tab-1" hidden={tab !== 1}>
        {tab === 1 && (
          <Box sx={{ pt: 1 }}>
            <Typography paragraph color="text.secondary">
              Below is a list of chat commands able to be used in games.
            </Typography>
            <UiTable
              label="Chat commands"
              columns={commandColumns}
              rows={commandTableRows}
              rowKey="term"
              emptyMessage="No matching commands found."
            />
          </Box>
        )}
      </Box>
    </section>
  );
}
