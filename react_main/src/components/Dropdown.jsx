import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

import { useOnOutsideClick } from "./Basic";

export default function Dropdown(props) {
  const [menuVisible, setMenuVisible, dropdownContainerRef, dropdownMenuRef] =
    useDropdown();
  const selOption = props.options.filter(
    (option) => option == props.value || option.id == props.value
  )[0];
  const selLabel = selOption ? selOption.label || selOption : "";

  const menuItems = props.options.map((option) => {
    if (option == "divider") return <div className="dropdown-divider" />;

    if (typeof option == "string") option = { id: option, label: option };

    return (
      <div
        className="dropdown-menu-option"
        key={option.id}
        onClick={() => onMenuItemClick(option.id)}
      >
        {option.label} {option.placeholder}
      </div>
    );
  });

  function onMenuItemClick(optionId) {
    setMenuVisible(false);
    props.onChange(optionId);
  }

  function onControlClick() {
    setMenuVisible(!menuVisible);
  }

  return (
    <div
      className={`dropdown ${props.className || ""}`}
      ref={dropdownContainerRef}
    >
      <div className="dropdown-control" onClick={onControlClick}>
        {props.icon}
        {selLabel}
        {props.caret && <i className="fas fa-caret-down" />}
      </div>
      {menuVisible && (
        <div className="dropdown-menu" ref={dropdownMenuRef}>
          {menuItems}
        </div>
      )}
    </div>
  );
}

export function useDropdown() {
  const [menuVisible, setMenuVisible] = useState(false);
  const dropdownContainerRef = useRef();
  const dropdownMenuRef = useRef();

  useOnOutsideClick([dropdownMenuRef, dropdownContainerRef], () =>
    setMenuVisible(false)
  );

  useLayoutEffect(() => {
    if (!menuVisible) return;

    const containerRect = dropdownContainerRef.current.getBoundingClientRect();
    const menuRect = dropdownMenuRef.current.getBoundingClientRect();

    var menuLeft = containerRect.left;
    var menuTop = containerRect.top + containerRect.height + 1 + window.scrollY;
    var menuHorzShift = window.innerWidith - (menuLeft + menuRect.width);

    if (menuTop + menuRect.height - window.scrollY > window.innerHeight)
      menuTop = containerRect.top - menuRect.height - 2;

    if (menuHorzShift < 0) {
      if (menuLeft + menuHorzShift < 0)
        menuHorzShift -= menuLeft + menuHorzShift;
    } else menuHorzShift = 0;

    dropdownMenuRef.current.style.left = menuLeft + "px";
    dropdownMenuRef.current.style.top = menuTop + "px";
    dropdownMenuRef.current.style.visibility = "visible";
  });

  return [menuVisible, setMenuVisible, dropdownContainerRef, dropdownMenuRef];
}
