import React, { useState, useEffect, useContext } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Box, Grid, Stack, Tab, Tabs, Typography } from "@mui/material";

import { UserContext } from "Contexts";

import { ModCommands } from "./Moderation/ModCommands";
import { ModActions } from "./Moderation/ModActions";
import { GroupPanels } from "./Moderation/GroupPanels";

import "css/main.css";
import "css/moderation.css";

export { ModCommands, COMMAND_COLOR } from "./Moderation/ModCommands";

export function ModerationLog() {
  const { results = "", setResults = () => {}, user } =
    useOutletContext() || {};

  return (
    <>
      <Grid container rowSpacing={1} columnSpacing={1} className="moderation">
        <Grid item xs={12} key={"mission-statement"}></Grid>
        <Grid item xs={12} md={8} key={"execute-action"}>
          <Stack direction="column" spacing={1}>
            <Stack direction="column" spacing={1}>
              {user?.perms?.viewModActions && (
                <div className="box-panel">
                  <Typography variant="h3">Execute Action</Typography>
                  <Stack direction="column" spacing={1}>
                    <ModCommands
                      results={results}
                      setResults={setResults}
                      fixedHeight
                    />
                    {results && <Box>{results}</Box>}
                  </Stack>
                </div>
              )}
              <GroupPanels user={user} />
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={4} key={"mod-actions"}>
          <Stack direction="column" spacing={1}>
            <ModActions setResults={setResults} />
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

function getTabValue(pathname) {
  if (pathname.includes("/reports")) return "reports";
  if (pathname.includes("/competitive")) return "competitive";
  if (pathname.includes("/handbook")) return "handbook";
  if (pathname.includes("/flagged-intake")) return "flagged-intake";
  if (pathname.includes("/volunteer")) return "volunteer";
  return "log";
}

export default function Moderation() {
  const [results, setResults] = useState("");
  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const tabValue = getTabValue(location.pathname);

  useEffect(() => {
    document.title = "Moderation | UltiMafia";
  }, []);

  useEffect(() => {
    if (!user.loaded) return;

    if (
      location.pathname.includes("/reports") &&
      !user?.perms?.viewModActions
    ) {
      navigate("/policy/moderation", { replace: true });
    } else if (
      location.pathname.includes("/competitive") &&
      !user?.perms?.manageCompetitive
    ) {
      navigate("/policy/moderation", { replace: true });
    } else if (
      location.pathname.includes("/flagged-intake") &&
      !user?.perms?.whitelist
    ) {
      navigate("/policy/moderation", { replace: true });
    }
  }, [
    location.pathname,
    user.loaded,
    user?.perms?.viewModActions,
    user?.perms?.manageCompetitive,
    user?.perms?.whitelist,
    navigate,
  ]);

  const handleTabChange = (_, newValue) => {
    const base = "/policy/moderation";
    if (newValue === "log") navigate(base);
    else if (newValue === "reports") navigate(`${base}/reports`);
    else if (newValue === "competitive") navigate(`${base}/competitive`);
    else if (newValue === "handbook") navigate(`${base}/handbook`);
    else if (newValue === "flagged-intake") navigate(`${base}/flagged-intake`);
    else if (newValue === "volunteer") navigate(`${base}/volunteer`);
  };

  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Tab label="Moderation Log" value="log" />
        <Tab label="Staff Handbook" value="handbook" />
        <Tab label="Volunteer" value="volunteer" />
        {user?.perms?.viewModActions && (
          <Tab label="Reports" value="reports" />
        )}
        {user?.perms?.manageCompetitive && (
          <Tab label="Competitive Management" value="competitive" />
        )}
        {user?.perms?.whitelist && (
          <Tab label="Flagged Intake" value="flagged-intake" />
        )}
      </Tabs>

      <Outlet
        context={{
          results,
          setResults,
          user,
        }}
      />
    </Box>
  );
}