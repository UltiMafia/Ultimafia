import React from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Grid2,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import { SearchBar } from "./Nav";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { Loading } from "./Loading";

export function LearnSearch({
  tabs = [],
  tabValue,
  onTabChange,
  searchPlaceholder = "🔎 Search",
  searchVal = "",
  onSearchInput,
  items = [],
  getItemKey = (item) => item.name,
  getItemName = (item) => item.name,
  renderIcon,
  renderCell,
  extraToolbarContent = null,
  gridColumns = { xs: 4, sm: 6, md: 8 },
  loading = false,
}) {
  const isPhoneDevice = useIsPhoneDevice();

  const hasTabs = Array.isArray(tabs) && tabs.length > 0;
  const tabButtons = hasTabs
    ? tabs.map((t) => (
          <Tab
            key={typeof t === "object" ? t.value : t}
            label={typeof t === "object" ? t.label : t}
            value={typeof t === "object" ? t.value : t}
            onClick={() => onTabChange?.(typeof t === "object" ? t.value : t)}
          />
        ))
    : null;

  if (loading) return <Loading small />;

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction={isPhoneDevice ? "column-reverse" : "row"} spacing={1}>
        {hasTabs && (
          <Tabs value={tabValue ?? ""} onChange={(_, value) => onTabChange?.(value)}>
            {tabButtons}
          </Tabs>
        )}
        <Box sx={{ ml: hasTabs && !isPhoneDevice ? "auto !important" : undefined }}>
          <SearchBar
            value={searchVal}
            placeholder={searchPlaceholder}
            onInput={onSearchInput ?? (() => {})}
          />
        </Box>
      </Stack>
      {extraToolbarContent}
      <Divider direction="horizontal" sx={{ mb: 1 }} />
      <Paper sx={{ p: 1 }}>
        <Grid2 container spacing={1} columns={gridColumns}>
          {items.map((item) => {
            const key = getItemKey(item);
            const name = getItemName(item);
            const icon = renderIcon ? renderIcon(item) : null;
            const cell = renderCell
              ? renderCell(item, icon)
              : (
                  <Paper variant="outlined" key={key} sx={{ p: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {icon}
                      <Typography variant="body2">{name}</Typography>
                    </Stack>
                  </Paper>
                );
            return (
              <Grid2 size={{ xs: 2 }} key={key}>
                {cell}
              </Grid2>
            );
          })}
        </Grid2>
      </Paper>
    </Stack>
  );
}
