import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, MenuItem, Box } from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

export default function NavDropdown({ label, items, basePath }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsPhoneDevice();
  const open = Boolean(anchorEl);

  // Check if any of the dropdown items are currently active
  const isActive = items.some(item => {
    if (item.hide) return false;
    return location.pathname === item.path || location.pathname.startsWith(item.path + "/");
  });

  const handleClick = (event) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    handleClose();
    if (path) {
      navigate(path);
    }
  };

  return (
    <>
      <Box
        component="span"
        onClick={handleClick}
        className={`nav-dropdown ${isActive ? "active" : ""} glow-on-hover`}
        sx={{
          padding: "8px 16px",
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
        <span>{label}</span>
        <i
          className="fas fa-caret-down"
          style={{ marginLeft: "6px", fontSize: "12px" }}
        />
      </Box>
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
          
          return (
            <MenuItem
              key={item.path || index}
              onClick={() => handleMenuItemClick(item.path)}
              selected={location.pathname === item.path}
            >
              {item.text}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

