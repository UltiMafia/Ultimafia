import React, { useContext, useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Menu,
  MenuItem,
  ListSubheader,
  Box,
  Divider,
  IconButton,
  Typography,
  Button,
} from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { InGameContext } from "Contexts";
import UiIcon from "./ui/UiIcon";

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
  const inGame = useContext(InGameContext);
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

  // Close when the route changes (e.g. browser back/forward), so an open menu
  // never lingers over the next page, and when a game takes the screen (the
  // shell keeps its location, so that is not a route change it can see).
  useEffect(() => {
    setAnchorEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, inGame]);

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
      <UiIcon name="menu" />
    </IconButton>
  ) : (
    <Button
      className={`site-nav-trigger ${isActive ? "is-current" : ""}`}
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
      endIcon={<UiIcon name="down" size={16} />}
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
          if (item.info) {
            return <ListSubheader key={`info-${index}`} disableSticky sx={{ py: 1.5, lineHeight: 1.6, fontSize: 12, color: "text.secondary" }}>{item.text}</ListSubheader>;
          }

          const navigation = item.href
            ? { component: "a", href: item.href, target: "_blank", rel: "noopener noreferrer" }
            : item.path ? { component: NavLink, to: item.path } : {};
          return (
            <MenuItem
              {...navigation}
              key={item.path || item.text || index}
              disabled={item.disabled}
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
