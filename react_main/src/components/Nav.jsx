import React from "react";
import UiAction from "./ui/UiAction";
import UiIcon from "./ui/UiIcon";
import { NavLink, useLocation } from "react-router-dom";

import Dropdown from "./Dropdown";

import "css/nav.css";
import { Box, TextField } from "@mui/material";

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
  const page = props.page;
  const maxPage = props.maxPage;
  const range = props.range || 5;
  const onNav = props.onNav;
  const inverted = props.inverted;
  const noRange = maxPage == null;

  const count = noRange ? 1 : Math.max(0, Math.min(range, maxPage));
  const start = noRange ? page : Math.max(1, Math.min(page - Math.floor(count / 2), maxPage - count + 1));
  const pages = Array.from({ length: count }, (_, index) => start + index);

  function onClick(page) {
    if (!props.disabled && page >= 1 && (noRange || page <= maxPage)) onNav(page);
  }

  const pageNums = pages.map((page) => {
    return (
      <UiAction iconOnly variant="ghost" key={page} className="page-nav-number"
        aria-label={`Page ${page}`} aria-current={props.page === page ? "page" : undefined}
        data-distant={Math.abs(props.page - page) > 1} disabled={props.disabled}
        onClick={() => onClick(page)}
      >
        {page}
      </UiAction>
    );
  });

  return (
    <Box component="nav" aria-label={props.label || "Pagination"} className={`page-nav ${inverted ? "inverted" : ""}`}>
      <UiAction iconOnly variant="ghost" className="page-nav-boundary" aria-label="First page" disabled={props.disabled || page <= 1} onClick={() => onClick(1)}>
        <UiIcon name="first" />
      </UiAction>
      <UiAction iconOnly variant="ghost" aria-label="Previous page" disabled={props.disabled || page <= 1}
        onClick={() => onClick(page - 1)}
      >
        <UiIcon name="previous" />
      </UiAction>
      {pageNums}
      <UiAction iconOnly variant="ghost" aria-label="Next page" disabled={props.disabled || (!noRange && page >= maxPage)}
        onClick={() => onClick(page + 1)}
      >
        <UiIcon name="next" />
      </UiAction>
      {!noRange && (
        <UiAction iconOnly variant="ghost" className="page-nav-boundary" aria-label="Last page" disabled={props.disabled || page >= maxPage}
          onClick={() => onClick(maxPage)}
        >
          <UiIcon name="last" />
        </UiAction>
      )}
    </Box>
  );
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
