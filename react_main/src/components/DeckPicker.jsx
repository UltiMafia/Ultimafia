import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { TextField, Popover, Tabs, Tab, Box, Typography } from "@mui/material";
import { UserContext } from "../Contexts";
import { filterProfanity } from "./Basic";

// Simple deck picker: text input with a popover dropdown showing
// tabs for "Yours" and "Popular" decks, and search-as-you-type.
// Clicking a deck fills in its id.
export default function DeckPicker({
  value,
  onChange,
  disabled,
  placeholder,
  label,
  helperText,
}) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("featured");
  const [inputValue, setInputValue] = useState(value || "");
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useContext(UserContext);

  // Keep input synced if parent value changes externally
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Determine list source: if user is typing a non-empty value, search.
  const searchMode = inputValue && inputValue.length > 0;

  useEffect(() => {
    if (!open) return;
    const query = searchMode ? inputValue : "";
    const listType = searchMode ? "search" : tab;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`/api/deck/${listType}?page=1&query=${encodeURIComponent(query)}`)
      .then((res) => {
        if (cancelled) return;
        setDecks((res.data.decks || []).slice(0, 10));
      })
      .catch(() => {
        if (!cancelled) setDecks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, inputValue, searchMode]);

  function handleInputChange(e) {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);
    if (!open) setOpen(true);
  }

  function handleSelectDeck(deck) {
    setInputValue(deck.id);
    onChange(deck.id);
    setOpen(false);
  }

  return (
    <>
      <TextField
        inputRef={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        disabled={disabled}
        placeholder={placeholder}
        label={label}
        helperText={helperText}
        fullWidth
      />
      <Popover
        open={open && Boolean(inputRef.current)}
        anchorEl={inputRef.current}
        onClose={() => setOpen(false)}
        disableAutoFocus
        disableEnforceFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: Math.max(
                320,
                inputRef.current
                  ? inputRef.current.getBoundingClientRect().width
                  : 320
              ),
              maxHeight: 400,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        {!searchMode && (
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36 } }}
          >
            <Tab label="Featured" value="featured" />
            <Tab label="Popular" value="popular" />
            <Tab label="Yours" value="yours" />
          </Tabs>
        )}
        {searchMode && (
          <Box sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Search results for "{inputValue}"
            </Typography>
          </Box>
        )}
        <Box sx={{ overflow: "auto", flex: 1 }}>
          {loading && (
            <Typography variant="caption" sx={{ p: 1.5, display: "block", opacity: 0.7 }}>
              Loading...
            </Typography>
          )}
          {!loading && decks.length === 0 && (
            <Typography variant="caption" sx={{ p: 1.5, display: "block", opacity: 0.7 }}>
              No decks found.
            </Typography>
          )}
          {!loading &&
            decks.map((deck) => (
              <Box
                key={deck.id}
                onClick={() => handleSelectDeck(deck)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    flex: "0 0 40px",
                    borderRadius: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  style={
                    deck.coverPhoto
                      ? {
                          backgroundImage: `url(/uploads${deck.coverPhoto})`,
                        }
                      : undefined
                  }
                />
                <Typography
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {filterProfanity(deck.name || "", user.settings)}
                </Typography>
              </Box>
            ))}
        </Box>
      </Popover>
    </>
  );
}
