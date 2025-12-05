import React from "react";
import { Box, Stack, Typography, Link, Chip } from "@mui/material";
import { Time } from "./Basic";

export default function ReportTypology({ finalRuling }) {
  if (!finalRuling) {
    return (
      <Typography color="textSecondary">No final ruling available</Typography>
    );
  }

  return (
    <Box>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Violation
          </Typography>
          <Typography variant="h6">{finalRuling.violationName}</Typography>
          <Chip
            label={finalRuling.violationCategory}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Box>
          <Typography variant="caption" color="textSecondary">
            Violation ID
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {finalRuling.violationId}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="textSecondary">
            Ban Type
          </Typography>
          <Typography>{finalRuling.banType}</Typography>
        </Box>

        {finalRuling.banLength && (
          <Box>
            <Typography variant="caption" color="textSecondary">
              Ban Length
            </Typography>
            <Typography>{finalRuling.banLength}</Typography>
          </Box>
        )}

        {finalRuling.notes && (
          <Box>
            <Typography variant="caption" color="textSecondary">
              Notes
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {finalRuling.notes}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
