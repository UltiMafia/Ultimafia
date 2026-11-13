import React, { useState, useRef, useEffect } from "react";
import UiAction from "./ui/UiAction";
import UiIcon from "./ui/UiIcon";
import { useOnOutsideClick } from "./Basic";
import {
  Menu,
  MenuItem,
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
  checkedValues,
  icon,
  className,
  disabled = false,
  label,
  iconOnly = false,
  anchorOrigin = { vertical: "top", horizontal: "left" },
  transformOrigin = { vertical: "bottom", horizontal: "left" },
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [checkedItems, setCheckedItems] = useState(
    options.reduce((acc, option) => {
      if (option?.type === "checkbox") acc[option.id] = option.value;
      return acc;
    }, {})
  );

  const dropdownContainerRef = useRef(null);
  const triggerRef = useRef(null);
  const [menuId] = useState(() => `dropdown-${++nextDropdownId}`);
  const checkboxDefaults = JSON.stringify(options.filter(option => option?.type === "checkbox").map(option => [option.id, option.value ?? false]));
  useEffect(() => {
    setCheckedItems(Object.fromEntries(JSON.parse(checkboxDefaults)));
  }, [checkboxDefaults]);
  useEffect(() => { if (disabled) setMenuVisible(false); }, [disabled]);
  useOnOutsideClick([dropdownContainerRef], () => setMenuVisible(false));

  const handleCheckboxChange = (event, option) => {
    event.stopPropagation();
    if (disabled || option.disabled) return;

    const updatedCheckedItems = {
      ...checkedItems,
      [option.id]: !(checkedValues || checkedItems)[option.id],
    };

    setCheckedItems(updatedCheckedItems);
    if (onCheckboxChange) {
      onCheckboxChange(option.id, updatedCheckedItems[option.id]);
    }
  };

  const handleMenuItemClick = (optionId) => {
    setMenuVisible(false);
    if (!disabled) onChange?.(optionId);
  };

  const menuItems = options.map((option, index) => {
    if (option === "divider") {
      return <Divider key={`divider-${index}`} className="dropdown-divider" />;
    }

    if (typeof option === "string") {
      option = { id: option, label: option };
    }

    return option.type === "checkbox" ? (
      <MenuItem key={option.id} className="dropdown-menu-option" disableRipple
        role="menuitemcheckbox" aria-checked={!!(checkedValues || checkedItems)[option.id]}
        disabled={disabled || option.disabled} onClick={event => handleCheckboxChange(event, option)}>
        <ListItemIcon>
          <Checkbox
            checked={!!(checkedValues || checkedItems)[option.id]}
            tabIndex={-1} disableRipple inputProps={{ "aria-hidden": true, readOnly: true }} sx={{ pointerEvents: "none" }}
          />
        </ListItemIcon>
        <ListItemText primary={option.label} />
      </MenuItem>
    ) : (
      <MenuItem
        key={option.id}
        className="dropdown-menu-option"
        disabled={disabled || option.disabled}
        selected={option.id === value}
        onClick={() => handleMenuItemClick(option.id)}
      >
        {option.label} {option.placeholder}
      </MenuItem>
    );
  });

  return (
    <div className={`dropdown ${className || ""}`} ref={dropdownContainerRef}>
      <UiAction ref={triggerRef} iconOnly={iconOnly} variant={iconOnly ? "ghost" : "secondary"}
        className="dropdown-control"
        disabled={disabled} aria-label={label} title={label}
        aria-haspopup="menu" aria-expanded={menuVisible}
        aria-controls={menuVisible ? menuId : undefined}
        onClick={() => setMenuVisible(!menuVisible)}
      >
        {icon}
        {!iconOnly && (options.find((opt) => (opt?.id ?? opt) === value)?.label ?? (typeof value === "string" && options.includes(value) ? value : null))}
        {!iconOnly && <UiIcon name="down" size={16} />}
      </UiAction>

      <Menu
        id={menuId} anchorEl={triggerRef.current}
        open={menuVisible && !disabled}
        onClose={() => setMenuVisible(false)}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        {menuItems}
      </Menu>
    </div>
  );
}

let nextDropdownId = 0;
