import { NavLink } from "react-router-dom";
import { AppBar, Toolbar, Stack, Typography } from "@mui/material";

export default function CustomAppBar({ links }) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Stack direction="row" spacing={0} sx={{ alignItems: "center" }}>
          {links.map((link) => {
            if (link.hide) return <></>;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                style={({ isActive }) => {
                  return {
                    padding: "var(--mui-spacing)",
                    fontWeight: isActive ? "bold" : undefined,
                    color: isActive
                      ? "var(--mui-palette-activeAppBarText-main)"
                      : "inherit",
                  };
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "inherit",
                    color: "inherit",
                  }}
                >
                  {link.text}
                </Typography>
              </NavLink>
            );
          })}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
