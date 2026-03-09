import React, { useContext, useRef } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Grid2,
  Paper,
  Stack,
  Divider,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material";
import { UserContext, SiteInfoContext } from "../Contexts";
import { SearchBar } from "./Nav";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { Loading } from "./Loading";

export function CellSearch({
  tabs = [],
  tabValue,
  onTabChange,
  searchPlaceholder = "🔎 Search",
  searchVal = "",
  onSearchInput,
  tagOptions = null,
  selectedTags = [],
  onSelectedTagsChange = null,
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
  const useTagAutocomplete = Array.isArray(tagOptions) && tagOptions.length > 0 && onSelectedTagsChange != null;

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

  const searchControl = useTagAutocomplete ? (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={tagOptions}
      value={selectedTags}
      inputValue={searchVal}
      onInputChange={(_, value) => onSearchInput?.(value ?? "")}
      onChange={(_, newValue) => {
        const tagSet = new Set(tagOptions);
        onSelectedTagsChange(newValue.filter((v) => typeof v === "string" && tagSet.has(v)));
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={searchPlaceholder}
        />
      )}
      sx={{ minWidth: 200, flex: 1 }}
      ListboxProps={{ sx: { maxHeight: 280 } }}
    />
  ) : (
    <SearchBar
      value={searchVal}
      placeholder={searchPlaceholder}
      onInput={onSearchInput ?? (() => {})}
    />
  );

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction={isPhoneDevice ? "column-reverse" : "row"} spacing={1}>
        {hasTabs && (
          <Tabs value={tabValue ?? ""} onChange={(_, value) => onTabChange?.(value)}>
            {tabButtons}
          </Tabs>
        )}
        <Box sx={{ ml: hasTabs && !isPhoneDevice ? "auto !important" : undefined, flex: useTagAutocomplete ? 1 : undefined, minWidth: useTagAutocomplete ? 0 : undefined }}>
          {searchControl}
        </Box>
      </Stack>
      {!useTagAutocomplete && extraToolbarContent}
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

function CellBanner(props) {
  const text = props.text;
  const type = props.type;

  return (
    <>
      <div className={`role-banner ${type}`}>
        <div className="role-banner-text">{text}</div>
      </div>
    </>
  );
}

function CellBanners(props) {
  const newlyAdded = props.newlyAdded;
  const recentlyUpdated = props.recentlyUpdated;
  const featured = props.featured;

  var banners = [];
  if (newlyAdded) {
    banners.push(<CellBanner key="newlyAdded" type="newlyAdded" text="new" />);
  }

  if (recentlyUpdated) {
    banners.push(
      <CellBanner
        key="recentlyUpdated"
        type="recentlyUpdated"
        text={<i className="fas fa-sync" />}
      />
    );
  }

  if (featured) {
    banners.push(
      <CellBanner
        key="featured"
        type="featured"
        text={<i className="fas fa-star" />}
      />
    );
  }

  return (
    <>
      <div className="role-banner-wrapper">
        <div className="role-banners">{banners}</div>
      </div>
    </>
  );
}

export function Cell(props) {
  const iconLength = props.iconLength || "2em";
  const item = props.item;
  const icon = props.icon;
  const onAddClick = props.onAddClick;
  const onDelClick = props.onDelClick;

  const user = useContext(UserContext);
  const cellRef = useRef();
  const isPhoneDevice = useIsPhoneDevice();

  const myHeight = `calc(1.2 * ${iconLength} + 2 * var(--mui-spacing))`;

  if (item === undefined) {
    return (
      <Box
        sx={{
          minWidth: 0,
          height: myHeight,
          minHeight: "var(--mui-spacing)",
          borderRadius: "var(--mui-shape-borderRadius)",
          border: `1px solid var(--mui-palette-divider)`,
        }}
      />
    );
  }

  return (
    <Paper
      variant="outlined"
      className="role-cell"
      key={item.name}
      sx={{
        p: isPhoneDevice ? 0.5 : 1,
        lineHeight: "normal",
        height: myHeight,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          width: "100%",
        }}
        ref={cellRef}
      >
        {user.loggedIn && onAddClick && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(item);
            }}
            sx={{
              padding: 1,
              bgcolor: "#62a0db",
              alignSelf: "stretch",
              minWidth: "0px",
            }}
          >
            <i
              className="fa-plus fas"
              aria-hidden="true"
              style={{ fontSize: "0.5em" }}
            />
          </Button>
        )}
        {user.loggedIn && onDelClick && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelClick(item);
            }}
            sx={{
              padding: 1,
              bgcolor: "#e45050",
              alignSelf: "stretch",
              minWidth: "0px",
            }}
          >
            <i
              className="fa-times fas"
              aria-hidden="true"
              style={{ fontSize: "0.5em" }}
            />
          </Button>
        )}
        {icon}
        <Typography
          variant="body2"
          sx={{
            flex: "1",
            textAlign: "right",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {item.name}
        </Typography>
      </Stack>
      {(item.newlyAdded || item.recentlyUpdated || item.featured) && (
        <CellBanners
          newlyAdded={item.newlyAdded}
          recentlyUpdated={item.recentlyUpdated}
          featured={item.featured}
          sx={{ padding: "2px" }}
        />
      )}
    </Paper>
  );
}
