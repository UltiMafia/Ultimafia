import React, { useState, useRef } from "react";
import { useOnOutsideClick } from "./Basic";
import {
  Menu,
  MenuItem,
  Button,
  Divider,
  Checkbox,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

export default function Dropdown(props) {
  const [menuVisible, setMenuVisible, dropdownContainerRef] = useDropdown();

  const selOption = props.options.find(
    (option) => option === props.value || option.id === props.value
  );
  const selLabel = selOption ? selOption.label || selOption : "";

  const menuItems = props.options.map((option, index) => {
    if (option === "divider") {
      return <Divider key={`divider-${index}`} className="dropdown-divider" />;
    }

    if (typeof option === "string") {
      option = { id: option, label: option };
    }

    return option.type === "checkbox" ? (
      <MenuItem key={option.id} className="dropdown-menu-option">
        <ListItemIcon>
          <Checkbox
            checked={option.value}
            onChange={() => onCheckboxChange(option)}
          />
        </ListItemIcon>
        <ListItemText primary={option.label} />
      </MenuItem>
    ) : (
      <MenuItem
        key={option.id}
        className="dropdown-menu-option"
        onClick={() => onMenuItemClick(option.id)}
      >
        {option.label} {option.placeholder}
      </MenuItem>
    );
  });

  function onCheckboxChange(option) {
    option.value = !option.value;
    props.onCheckboxChange(option.id, option.value);
  }

  function onMenuItemClick(optionId) {
    setMenuVisible(false);
    props.onChange(optionId);
  }

  function onControlClick(event) {
    setMenuVisible(!menuVisible);
  }

  return (
    <div
      className={`dropdown ${props.className || ""}`}
      ref={dropdownContainerRef}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={onControlClick}
        sx={{ textTransform: "none" }}
        endIcon={props.caret}
        className="dropdown-control"
      >
        {props.icon}
        {selLabel}
      </Button>

      <Menu
        anchorEl={dropdownContainerRef.current}
        open={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {menuItems}
      </Menu>
    </div>
  );
}

export function useDropdown() {
  const [menuVisible, setMenuVisible] = useState(false);
  const dropdownContainerRef = useRef();

  useOnOutsideClick([dropdownContainerRef], () => setMenuVisible(false));

  return [menuVisible, setMenuVisible, dropdownContainerRef];
}
