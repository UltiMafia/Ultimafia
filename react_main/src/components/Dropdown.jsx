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

export default function Dropdown({
  options,
  value,
  onChange,
  onCheckboxChange,
  icon,
  className,
  anchorOrigin = { vertical: "top", horizontal: "left" },
  transformOrigin = { vertical: "bottom", horizontal: "left" },
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const dropdownContainerRef = useRef(null);

  useOnOutsideClick([dropdownContainerRef], () => setMenuVisible(false));

  const selOption = options.find(
    (option) => option === value || option.id === value
  );
  const selLabel = selOption ? selOption.label || selOption : "";

  const menuItems = options.map((option, index) => {
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

  function onMenuItemClick(optionId) {
    setMenuVisible(false);
    onChange(optionId);
  }

  function onControlClick() {
    setMenuVisible((prev) => !prev);
  }

  return (
    <div className={`dropdown ${className || ""}`} ref={dropdownContainerRef}>
      <Button className="dropdown-control" onClick={onControlClick}>
        {icon}
        {selLabel}
      </Button>

      <Menu
        anchorEl={dropdownContainerRef.current}
        open={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        {menuItems}
      </Menu>
    </div>
  );
}
