import React, { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { Menu, MenuItem, Box, Divider, IconButton, Typography, Stack, Button } from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export default function NavDropdown({
  label,
  items,
  customTrigger,
  onMenuItemClick: customOnMenuItemClick,
  groups, // For mobile unified menu - array of {label, items}
  isMobileMenu = false, // Flag to indicate this is the mobile unified menu
}) {
  const [anchorEl, setAnchorEl] = useState(null);
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
      location.pathname.startsWith(item.path)
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
      {customTrigger}
    </Box>
  ) : isMobileMenu ? (
    <IconButton
      large
      onClick={handleClick}
      aria-label="menu"
    >
      <i className="fas fa-bars" />
    </IconButton>
  ) : (
    <Button
      variant="text"
      onClick={handleClick}
      sx={{
        px: 1,
        cursor: "pointer",
        textTransform: "uppercase",
        color: "inherit",
        backgroundColor: !isMobileMenu && isActive ? "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity));" : undefined,
      }}
      endIcon={<i className="fas fa-caret-down" aria-hidden="true" />}
    >
      <Typography variant="h3">
        {label}
      </Typography>
    </Button>
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

          const menuItem = (
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

          if (item.path) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  color: "inherit",
                }}
              >
                {menuItem}
              </NavLink>
            );
          } else {
            return menuItem;
          }
        })}
      </Menu>
    </>
  );
}
