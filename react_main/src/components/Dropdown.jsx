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
  const [checkedItems, setCheckedItems] = useState(
    options.reduce((acc, option) => {
      if (option.type === "checkbox") acc[option.id] = option.value;
      return acc;
    }, {})
  );

  const dropdownContainerRef = useRef(null);
  useOnOutsideClick([dropdownContainerRef], () => setMenuVisible(false));

  const handleCheckboxChange = (event, option) => {
    event.stopPropagation();

    const updatedCheckedItems = {
      ...checkedItems,
      [option.id]: !checkedItems[option.id],
    };

    setCheckedItems(updatedCheckedItems);
    if (onCheckboxChange) {
      onCheckboxChange(option.id, updatedCheckedItems[option.id]);
    }
  };

  const handleMenuItemClick = (optionId) => {
    setMenuVisible(false);
    onChange(optionId);
  };

  const menuItems = options.map((option, index) => {
    if (option === "divider") {
      return <Divider key={`divider-${index}`} className="dropdown-divider" />;
    }

    if (typeof option === "string") {
      option = { id: option, label: option };
    }

    return option.type === "checkbox" ? (
      <MenuItem key={option.id} className="dropdown-menu-option" disableRipple>
        <ListItemIcon>
          <Checkbox
            checked={checkedItems[option.id] || false}
            onChange={(e) => handleCheckboxChange(e, option)}
          />
        </ListItemIcon>
        <ListItemText primary={option.label} />
      </MenuItem>
    ) : (
      <MenuItem
        key={option.id}
        className="dropdown-menu-option"
        onClick={() => handleMenuItemClick(option.id)}
      >
        {option.label} {option.placeholder}
      </MenuItem>
    );
  });

  return (
    <div className={`dropdown ${className || ""}`} ref={dropdownContainerRef}>
      <Button
        className="dropdown-control"
        onClick={() => setMenuVisible(!menuVisible)}
      >
        {icon}
        {options.find((opt) => opt.id === value)?.label}
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
