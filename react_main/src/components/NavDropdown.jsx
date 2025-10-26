import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, MenuItem, Box, Divider } from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export default function NavDropdown({
  label,
  items,
  customTrigger,
  customTriggerProps,
  onMenuItemClick: customOnMenuItemClick,
  groups, // For mobile unified menu - array of {label, items}
  isMobileMenu = false, // Flag to indicate this is the mobile unified menu
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsPhoneDevice();
  const open = Boolean(anchorEl);

  // Flatten items for mobile menu or use regular items
  const allItems = groups
    ? groups.reduce((acc, group, groupIndex) => {
        if (groupIndex > 0) {
          acc.push({ divider: true });
        }
        return acc.concat(group.items);
      }, [])
    : items;

  // Check if any of the dropdown items are currently active
  const isActive = allItems.some((item) => {
    if (item.hide || item.divider) return false;
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
        padding: "8px 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
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
      {isMobileMenu && <span style={{ fontSize: "18px" }}>☰</span>}
      <span>{label}</span>
      <i
        className="fas fa-caret-down"
        style={{ fontSize: isMobile ? "10px" : "12px" }}
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
        disableScrollLock={true}
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
        {allItems.map((item, index) => {
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

