// Test page for test/run-user-search.cjs: UserSearchSelect used the way the
// mod commands form uses it (no `value` prop) and the way controlled callers
// use it (`value` = the picked name), each next to a plain text field to move
// focus to. window.__picked holds the last id each one reported.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { createTheme, Stack, TextField, ThemeProvider } from "@mui/material";
import { UserSearchSelect } from "../src/components/Form";

const theme = createTheme({ palette: { mode: "dark" } });
window.__picked = {};

function Uncontrolled() {
  return (
    <Stack spacing={2} data-testid="uncontrolled">
      <UserSearchSelect
        placeholder="User (uncontrolled)"
        onChange={(id) => {
          window.__picked.uncontrolled = id;
        }}
      />
      <TextField placeholder="Length" inputProps={{ "data-testid": "other-uncontrolled" }} />
    </Stack>
  );
}

function Controlled() {
  const [name, setName] = useState("");
  return (
    <Stack spacing={2} data-testid="controlled">
      <UserSearchSelect
        placeholder="User (controlled)"
        value={name}
        onChange={(id, picked) => {
          window.__picked.controlled = id;
          setName(picked || "");
        }}
      />
      <TextField placeholder="Reason" inputProps={{ "data-testid": "other-controlled" }} />
    </Stack>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Stack spacing={4} sx={{ p: 4, width: 400 }}>
        <Uncontrolled />
        <Controlled />
      </Stack>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
window.__userSearchReady = true;
