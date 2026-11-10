import React, { useContext } from "react";
import { Stack } from "@mui/material";
import { UserContext } from "../Contexts";
import { SearchBar } from "./Nav";
import { Loading } from "./Loading";
import { UiAction, UiIcon, UiReferenceList, UiReferenceEntry, UiReferenceToolbar, UiAutocomplete as Autocomplete, UiField as TextField, UiTabs as Tabs, UiTab as Tab } from "./ui";

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
  variant = "directory",
  label = "Reference entries",
  loading = false,
}) {
  const useTagAutocomplete = Array.isArray(tagOptions) && tagOptions.length > 0 && onSelectedTagsChange != null;

  const hasTabs = Array.isArray(tabs) && tabs.length > 0;
  const tabButtons = hasTabs
    ? tabs.map((t) => (
          <Tab
            key={typeof t === "object" ? t.value : t}
            label={typeof t === "object" ? t.label : t}
            value={typeof t === "object" ? t.value : t}
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
          inputProps={{ ...params.inputProps, "aria-label": `Search ${label.toLowerCase()}` }}
        />
      )}
      ListboxProps={{ sx: { maxHeight: 280 } }}
    />
  ) : (
    <SearchBar
      value={searchVal}
      placeholder={searchPlaceholder}
      label={`Search ${label.toLowerCase()}`}
      onInput={onSearchInput ?? (() => {})}
    />
  );

  return (
    <Stack direction="column" spacing={1}>
      <UiReferenceToolbar navigation={hasTabs && (
          <Tabs variant="scrollable" scrollButtons="auto" value={tabValue ?? ""} onChange={(_, value) => onTabChange?.(value)}>
            {tabButtons}
          </Tabs>
        )} search={searchControl}>
        {!useTagAutocomplete && extraToolbarContent}
      </UiReferenceToolbar>
      <UiReferenceList label={label} variant={variant} items={items} getItemKey={getItemKey} renderEntry={item => {
          const name = getItemName(item);
          const icon = renderIcon ? renderIcon(item) : null;
          const cell = renderCell
            ? renderCell(item, icon)
            : (
                <UiReferenceEntry name={name} icon={icon} />
              );
          return cell;
        }} />
    </Stack>
  );
}

export function Cell(props) {
  const item = props.item;
  const icon = props.icon;
  const onAddClick = props.onAddClick;
  const onDelClick = props.onDelClick;

  const user = useContext(UserContext);
  if (item === undefined) return <UiReferenceEntry />;
  return <UiReferenceEntry name={item.name} description={item.description} icon={icon} actions={user.loggedIn && (onAddClick || onDelClick) && <>
      {user.loggedIn && onAddClick && <UiAction iconOnly aria-label={`Add ${item.name}`} onClick={(e) => { e.stopPropagation(); onAddClick(item); }}><UiIcon name="add" /></UiAction>}
      {user.loggedIn && onDelClick && <UiAction iconOnly variant="danger-quiet" aria-label={`Remove ${item.name}`} onClick={(e) => { e.stopPropagation(); onDelClick(item); }}><UiIcon name="remove" /></UiAction>}
    </>} />;
}
