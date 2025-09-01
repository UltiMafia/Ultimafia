import React, { useEffect, useReducer } from "react";
import { NavLink, useLocation } from "react-router-dom";

import Dropdown from "./Dropdown";

import "css/nav.css";
import { IconButton, Box, Typography, TextField } from "@mui/material";

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

  const [pages, updatePages] = useReducer(
    () => {
      if (noRange) return [page];

      var sel = page <= maxPage ? page : 1;
      var i = sel;
      var j = sel + 1;
      var list = [];
      var changed = true;

      while (changed) {
        changed = false;

        if (list.length < range && i >= 1) {
          list.unshift(i--);
          changed = true;
        }

        if (list.length < range && j <= maxPage) {
          list.push(j++);
          changed = true;
        }
      }

      return list;
    },
    maxPage,
    (pages) => {
      if (noRange) return [1];

      var list = [];

      for (let i = 0; i < pages; i++) list.push(i + 1);

      return list;
    }
  );

  useEffect(() => {
    updatePages();
  }, [page, range, maxPage]);

  function onClick(page) {
    if (page >= 1 && (noRange || page <= maxPage)) onNav(page);
  }

  const fontSize = "16px";
  const IconButtonSx = { width: "24px", height: "24px" };
  const pageNums = pages.map((page) => {
    let extraSx = null;
    if (props.page === page) {
      extraSx = { background: "var(--scheme-color-sec)" };
    }

    return (
      <IconButton
        color="primary"
        key={page}
        onClick={() => onClick(page)}
        sx={{ ...IconButtonSx, ...extraSx, fontSize }}
      >
        <Typography>{page}</Typography>
      </IconButton>
    );
  });

  return (
    <Box className={`page-nav ${inverted ? "inverted" : ""}`}>
      <IconButton color="primary" sx={IconButtonSx} onClick={() => onClick(1)}>
        <i style={{ fontSize }} className="fas fa-angle-double-left" />
      </IconButton>
      <IconButton
        color="primary"
        sx={IconButtonSx}
        onClick={() => onClick(page - 1)}
      >
        <i style={{ fontSize }} className="fas fa-angle-left" />
      </IconButton>
      {pageNums}
      <IconButton
        color="primary"
        sx={IconButtonSx}
        onClick={() => onClick(page + 1)}
      >
        <i style={{ fontSize }} className="fas fa-angle-right" />
      </IconButton>
      {!noRange && (
        <IconButton
          color="primary"
          sx={IconButtonSx}
          onClick={() => onClick(maxPage)}
        >
          <i style={{ fontSize }} className="fas fa-angle-double-right" />
        </IconButton>
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
        onChange={onInput}
        fullWidth
      />
    </Box>
  );
}
