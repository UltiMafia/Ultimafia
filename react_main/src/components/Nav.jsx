import React, { useState, useEffect, useReducer } from "react";
import { NavLink } from "react-router-dom";

import Dropdown from "./Dropdown";
import { camelCase } from "../utils";

import "../css/nav.css";

export function Nav(props) {
  return <div className="nav">{props.children}</div>;
}

export function SubNav(props) {
  const links = props.links.map(
    (link, i) =>
      !link.hide && (
        <NavLink exact={link.exact} to={link.path} key={link.path}>
          {link.text}
        </NavLink>
      )
  );

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
  const { page } = props;
  const { maxPage } = props;
  const range = props.range || 5;
  const { onNav } = props;
  const { inverted } = props;
  const noRange = maxPage == null;

  const [pages, updatePages] = useReducer(
    () => {
      if (noRange) return [page];

      const sel = page <= maxPage ? page : 1;
      let i = sel;
      let j = sel + 1;
      const list = [];
      let changed = true;

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

      const list = [];

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

  const pageNums = pages.map((page) => {
    let className = "page-num";

    if (props.page == page) className += " page-sel";

    return (
      <div className={className} onClick={() => onClick(page)} key={page}>
        {page}
      </div>
    );
  });

  return (
    <div className={`page-nav ${inverted ? "inverted" : ""}`}>
      <div className="page-nav-left max" onClick={() => onClick(1)}>
        «
      </div>
      <div className="page-nav-left" onClick={() => onClick(page - 1)}>
        ‹
      </div>
      {pageNums}
      <div
        className={`page-nav-right ${noRange ? "max" : ""}`}
        onClick={() => onClick(page + 1)}
      >
        ›
      </div>
      {!noRange && (
        <div className="page-nav-right max" onClick={() => onClick(maxPage)}>
          »
        </div>
      )}
    </div>
  );
}

export function getPageNavFilterArg(newPage, oldPage, pageItems, sortField) {
  let filterArg;

  if (newPage == 1) filterArg = "last=Infinity";
  else if (newPage < oldPage && pageItems.length != 0)
    filterArg = `first=${pageItems[0][sortField]}`;
  else if (newPage > oldPage && pageItems.length != 0)
    filterArg = `last=${pageItems[pageItems.length - 1][sortField]}`;
  else return;

  return filterArg;
}

export function SearchBar(props) {
  function onInput(event) {
    props.onInput(event.target.value);
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        onChange={onInput}
      />
      <div className="search-icon">
        <i className="fas fa-search" />
      </div>
    </div>
  );
}
