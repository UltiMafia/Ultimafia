import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Chip,
  Divider,
  Link,
  Stack,
  Typography,
  Paper,
} from "@mui/material";

import { CHANGELOG, CHANGELOG_CATEGORIES } from "data/changelog";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function ReleaseCard({ release }) {
  const sections = CHANGELOG_CATEGORIES.map((cat) => {
    const items = release.categories?.[cat.key];
    if (!items || !items.length) return null;
    return (
      <Box key={cat.key} sx={{ mb: 1.5 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            mb: 0.5,
            letterSpacing: 0.3,
          }}
        >
          {cat.label}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {items.map((line, i) => (
            <Typography
              component="li"
              variant="body2"
              key={i}
              sx={{ mb: 0.35 }}
            >
              {line}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  }).filter(Boolean);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 2,
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography variant="h3" sx={{ mb: 0.25 }}>
            {release.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(release.date)}
          </Typography>
        </Box>
        {release.prs?.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {release.prs.map((n) => (
              <Chip
                key={n}
                size="small"
                label={`#${n}`}
                component="a"
                href={`https://github.com/UltiMafia/Ultimafia/pull/${n}`}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </Stack>
      <Divider sx={{ mb: 1.5 }} />
      {sections.length ? (
        sections
      ) : (
        <Typography variant="body2" color="text.secondary">
          No categorized notes for this release.
        </Typography>
      )}
    </Paper>
  );
}

export default function Changelog() {
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    document.title = "Changelog | UltiMafia";
  }, []);

  const releases = useMemo(() => {
    if (!filter) return CHANGELOG;
    return CHANGELOG.filter((r) => {
      const items = r.categories?.[filter];
      return items && items.length > 0;
    }).map((r) => ({
      ...r,
      categories: { [filter]: r.categories[filter] },
    }));
  }, [filter]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Changelog
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        What's new on UltiMafia: features, game changes, site updates, and
        fixes. Newest first.
      </Typography>

      <Stack
        direction="row"
        spacing={0.75}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 2.5 }}
      >
        <Chip
          label="All"
          size="small"
          color={filter === null ? "primary" : "default"}
          onClick={() => setFilter(null)}
          variant={filter === null ? "filled" : "outlined"}
        />
        {CHANGELOG_CATEGORIES.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            size="small"
            color={filter === c.key ? "primary" : "default"}
            onClick={() => setFilter(c.key)}
            variant={filter === c.key ? "filled" : "outlined"}
          />
        ))}
      </Stack>

      {releases.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        Maintainers update{" "}
        <Box component="code" sx={{ fontSize: "0.85em" }}>
          react_main/src/data/changelog.js
        </Box>{" "}
        using{" "}
        <Box component="code" sx={{ fontSize: "0.85em" }}>
          docs/changelog/AGENT_TEMPLATE.md
        </Box>
        .
      </Typography>
    </Box>
  );
}
