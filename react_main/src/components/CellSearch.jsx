import React, { useContext, useRef } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Stack,
  Divider,
  Autocomplete,
  TextField,
} from "@mui/material";
import { UserContext, SiteInfoContext } from "../Contexts";
import { SearchBar } from "./Nav";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { Loading } from "./Loading";
import { UiAction, UiIcon } from "./ui";

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
          <Tabs variant="scrollable" scrollButtons="auto" value={tabValue ?? ""} onChange={(_, value) => onTabChange?.(value)}>
            {tabButtons}
          </Tabs>
        )}
        <Box sx={{ ml: !isPhoneDevice ? "auto !important" : undefined, flex: useTagAutocomplete ? 1 : undefined, minWidth: useTagAutocomplete ? 0 : undefined }}>
          {searchControl}
        </Box>
      </Stack>
      {!useTagAutocomplete && extraToolbarContent}
      <Divider direction="horizontal" sx={{ mb: 1 }} />
      <div className="cell-search-grid">
        {items.map((item) => {
          const key = getItemKey(item);
          const name = getItemName(item);
          const icon = renderIcon ? renderIcon(item) : null;
          const cell = renderCell
            ? renderCell(item, icon)
            : (
                <div className="role-cell" key={key}>
                  {icon}
                  <Typography variant="body2">{name}</Typography>
                </div>
              );
          return <div className="cell-search-item" key={key}>{cell}</div>;
        })}
      </div>
    </Stack>
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

  const description = Array.isArray(item.description) ? item.description[0] : item.description;
  return (
    <div className="role-cell" ref={cellRef}>
      {icon}
      <div className="role-cell-copy">
        <Typography variant="body2">{item.name}</Typography>
        {description && <Typography component="p" variant="caption" className="role-cell-description">{description}</Typography>}
      </div>
      {user.loggedIn && onAddClick && <UiAction iconOnly aria-label={`Add ${item.name}`} onClick={(e) => { e.stopPropagation(); onAddClick(item); }}><UiIcon name="add" /></UiAction>}
      {user.loggedIn && onDelClick && <UiAction iconOnly variant="danger-quiet" aria-label={`Remove ${item.name}`} onClick={(e) => { e.stopPropagation(); onDelClick(item); }}><UiIcon name="remove" /></UiAction>}
    </div>
  );
}
