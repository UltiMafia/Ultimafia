const { AppBar, Toolbar, Link, Stack } = require("@mui/material");

export default function CustomAppBar({ links }) {
  const windowPath = window.location.pathname;

  return (
    <AppBar position="static">
      <Toolbar>
        <Stack direction="row" spacing={0} sx={{ alignItems: "center" }}>
          {links.map((link, index) => {
            const linkPath = link.path.replace(window.location.protocol, '').replace(window.location.host, '').replace(window.location.port, '');
            const isSelected = windowPath === linkPath;

            return (<Link
              key={index}
              href={link.path}
              underline="none"
              color="inherit"
              variant="button"
              sx={{
                  p: 1,
                  border: isSelected ? "1px solid" : undefined,
                  borderColor: isSelected ? "primary.main" : undefined,
                  borderRadius: isSelected ? "var(--mui-shape-borderRadius)" : undefined,
              }}
            >
              {link.text}
            </Link>)
            }
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}