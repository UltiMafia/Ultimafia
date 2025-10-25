import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, MenuItem, Box, Divider } from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export default function NavDropdown({
  label,
  icon,
  items,
  customTrigger,
  customTriggerProps,
  onMenuItemClick: customOnMenuItemClick,
  iconOnly = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsPhoneDevice();
  const open = Boolean(anchorEl);

  // Check if any of the dropdown items are currently active
  const isActive = items.some((item) => {
    if (item.hide) return false;
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
    );
  });

  const handleClick = (event) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (item) => {
    handleClose();

    // If item has custom onClick, use that
    if (item.onClick) {
      item.onClick();
      return;
    }

    // If parent has custom handler, use that
    if (customOnMenuItemClick) {
      customOnMenuItemClick(item.path);
      return;
    }

    // Default navigation
    if (item.path) {
      navigate(item.path);
    }
  };

  // Render custom trigger if provided
  const triggerContent = customTrigger ? (
    <Box
      component="span"
      onClick={handleClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      {customTrigger(customTriggerProps)}
    </Box>
  ) : (
    <Box
      component="span"
      onClick={handleClick}
      className={`nav-dropdown ${isActive ? "active" : ""}`}
      sx={{
        padding: iconOnly ? "8px" : "8px 16px",
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        position: "relative",
        textTransform: "uppercase",
        color: isActive ? "var(--color-main-1)" : "inherit",
        fontWeight: isActive ? "bold" : "normal",
        "&:hover": {
          color: "var(--color-main-1)",
        },
      }}
    >
      {icon && (
        <Box
          component="img"
          src={icon}
          alt={label}
          sx={{
            width: iconOnly ? "20px" : "16px",
            height: iconOnly ? "20px" : "16px",
            marginRight: iconOnly ? "0" : "6px",
            display: "inline-block",
          }}
        />
      )}
      {!iconOnly && <span>{label}</span>}
      <i
        className="fas fa-caret-down"
        style={{ marginLeft: iconOnly ? "2px" : "6px", fontSize: "12px" }}
      />
    </Box>
  );

  return (
    <>
      {triggerContent}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isMobile ? "left" : "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isMobile ? "left" : "center",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: isMobile ? "200px" : "180px",
              maxWidth: "90vw",
            },
          },
        }}
      >
        {items.map((item, index) => {
          if (item.hide) return null;

          // Handle dividers
          if (item.divider) {
            return <Divider key={`divider-${index}`} />;
          }

          return (
            <MenuItem
              key={item.path || item.text || index}
              onClick={() => handleMenuItemClick(item)}
              selected={location.pathname === item.path}
            >
              {item.icon && (
                <Box component="span" sx={{ mr: 1, display: "inline-flex" }}>
                  {item.icon}
                </Box>
              )}
              {item.text}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
