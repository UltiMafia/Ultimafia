import React from "react";
import UiAction from "./ui/UiAction";
import UiIcon from "./ui/UiIcon";
import UiPagination from "./ui/UiPagination";
import { NavLink, useLocation } from "react-router-dom";

import Dropdown from "./Dropdown";

import "css/nav.css";
import { Box } from "@mui/material";
import { UiField as TextField } from "components/ui";

export function Nav(props) {
  return <div className="nav">{props.children}</div>;
}

export function SubNav(props) {
  const location = useLocation();
  const isPlayPage = location.pathname === "/play";
  if (isPlayPage) {
    return "";
  }

  const links = props.links.map((link, i) => {
    return (
      !link.hide && (
        <NavLink exact={link.exact} to={link.path} key={link.path}>
          {link.text}
        </NavLink>
      )
    );
  });

  return (
    <div className="sub-nav">
      {links}
      {props.showFilter && (
        <div className="filter">
          <Dropdown
            value={props.filterSel}
            options={props.filterOptions}
            onChange={props.onFilter}
            icon={props.filterIcon}
            caret
          />
        </div>
      )}
    </div>
  );
}

export function PageNav(props) {
  // One pagination widget for every list. `inverted` is accepted during
  // migration and ignored; the architecture guard counts it so it can only
  // shrink. See docs/frontend-redesign/UI_CONTROLS.md.
  if (props.maxPage == null && props.page == null) return null;
  // Unknown totals stay unknown: UiPagination renders cursor arrows instead of
  // inventing a single page, which would disable "next".
  return <UiPagination
    page={props.page || 1}
    count={props.maxPage}
    label={props.label || "Pagination"}
    disabled={Boolean(props.disabled)}
    onChange={value => props.onNav?.(value)}
  />;
}

export function getPageNavFilterArg(newPage, oldPage, pageItems, sortField) {
  var filterArg;

  if (newPage === 1) filterArg = "last=Infinity";
  else if (newPage < oldPage && pageItems.length !== 0)
    filterArg = `first=${pageItems[0][sortField]}`;
  else if (newPage >= oldPage && pageItems.length !== 0)
    filterArg = `last=${pageItems[pageItems.length - 1][sortField]}`;
  else return;

  return filterArg;
}

export function SearchBar(props) {
  function onInput(event) {
    props.onInput(event.target.value);
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <TextField
        variant="outlined"
        value={props.value}
        placeholder={props.placeholder}
        inputProps={{ "aria-label": props.label || props.placeholder || "Search" }} size="small"
        onChange={onInput}
        fullWidth
      />
    </Box>
  );
}
