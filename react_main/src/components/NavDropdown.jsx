import React, { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Menu,
  MenuItem,
  Box,
  Divider,
  IconButton,
  Typography,
  Button,
} from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export default function NavDropdown({
  label,
  items,
  customTrigger,
  onMenuItemClick: customOnMenuItemClick,
  groups,
  isMobileMenu = false,
  triggerAriaLabel,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const isMobile = useIsPhoneDevice();
  const open = Boolean(anchorEl);
  const menuId = `nav-menu-${label || triggerAriaLabel || "custom"}`;

  const allItems = groups
    ? groups.reduce((acc, group, groupIndex) => {
        if (groupIndex > 0) {
          acc.push({ divider: true });
        }
        return acc.concat(group.items);
      }, [])
    : items;

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

    if (item.onClick) {
      item.onClick();
      return;
    }

    if (customOnMenuItemClick) {
      customOnMenuItemClick(item.path);
      return;
    }
  };

  const menuTriggerProps = {
    "aria-haspopup": "true",
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    onClick: handleClick,
  };

  const triggerContent = customTrigger ? (
    <IconButton
      {...menuTriggerProps}
      aria-label={triggerAriaLabel || "User menu"}
      sx={{ p: 0 }}
    >
      {customTrigger}
    </IconButton>
  ) : isMobileMenu ? (
    <IconButton {...menuTriggerProps} aria-label="Menu" size="large">
      <i className="fas fa-bars" />
    </IconButton>
  ) : (
    <Button
      variant="text"
      {...menuTriggerProps}
      sx={{
        px: 1,
        cursor: "pointer",
        textTransform: "uppercase",
        color: "inherit",
        backgroundColor:
          !isMobileMenu && isActive
            ? "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity));"
            : undefined,
      }}
      endIcon={<i className="fas fa-caret-down" aria-hidden="true" />}
    >
      <Typography variant="h3">{label}</Typography>
    </Button>
  );

  return (
    <>
      {triggerContent}
      <Menu
        id={menuId}
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
