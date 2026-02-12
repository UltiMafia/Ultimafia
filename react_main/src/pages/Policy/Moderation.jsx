import React, { useState, useEffect, useContext } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import axios from "axios";
import { Box, Grid, Stack, Tab, Tabs, Typography } from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { UserContext } from "Contexts";

import { Badge, NameWithAvatar, StatusIcon } from "pages/User/User";
import { Loading } from "components/Loading";

import { ModCommands } from "./Moderation/ModCommands";
import { ModActions } from "./Moderation/ModActions";

import "css/main.css";
import "css/moderation.css";

export { ModCommands, COMMAND_COLOR } from "./Moderation/ModCommands";

export function ModerationLog() {
  const { results = "", setResults = () => {}, user } =
    useOutletContext() || {};
  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    axios
      .get("/api/mod/groups")
      .then((res) => {
        setGroups(res.data.sort((a, b) => b.rank - a.rank));
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(true);
        errorAlert(e);
      });
  }, []);

  const groupsPanels = groups.map((group) => {
    const members = group.members.map((member) => (
      <Grid item xs={12} md={6} key={member.id}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            p: 1,
            backgroundColor: "var(--scheme-color)",
          }}
        >
          <NameWithAvatar
            id={member.id}
            name={member.name}
            avatar={member.avatar}
          />
          <StatusIcon status={member.status} />
        </Stack>
      </Grid>
    ));

    return (
      <div className="box-panel group-panel" key={group.name}>
        <Stack direction="row" spacing={1}>
          <Typography variant="h4">{group.name + "s"}</Typography>
          {group.badge && (
            <Badge
              icon={group.badge}
              color={group.badgeColor || "black"}
              name={group.name}
            />
          )}
        </Stack>
        <Grid container rowSpacing={1} columnSpacing={1}>
          {members}
        </Grid>
      </div>
    );
  });

  if (!loaded) return <Loading small />;

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
              {groupsPanels}
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
    }
  }, [location.pathname, user?.perms?.viewModActions, user?.perms?.manageCompetitive, navigate]);

  const handleTabChange = (_, newValue) => {
    const base = "/policy/moderation";
    if (newValue === "log") navigate(base);
    else if (newValue === "reports") navigate(`${base}/reports`);
    else if (newValue === "competitive") navigate(`${base}/competitive`);
    else if (newValue === "handbook") navigate(`${base}/handbook`);
  };

  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab label="Moderation Log" value="log" />
        <Tab label="Staff Handbook" value="handbook" />
        {user?.perms?.viewModActions && (
          <Tab label="Reports" value="reports" />
        )}
        {user?.perms?.manageCompetitive && (
          <Tab label="Competitive Management" value="competitive" />
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
