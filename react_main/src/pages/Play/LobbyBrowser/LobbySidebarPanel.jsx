import { Paper, Typography } from "@mui/material";

export default function LobbySidebarPanel({ children, title }) {
  return (
    <Paper sx={{
      p: 2,
    }}>
      {title && (<Typography color="primary" variant="h3" gutterBottom sx={{
        borderBottom: 1,
        borderColor: "divider",
      }}>
        {title}
      </Typography>)}
      {children}
    </Paper>
  );
}