import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Box, Grid, Stack, Typography } from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { UserContext } from "Contexts";

import { Badge, NameWithAvatar, StatusIcon } from "pages/User/User";
import { Loading } from "components/Loading";

import { ModCommands } from "./Moderation/ModCommands";
import { ModActions } from "./Moderation/ModActions";

import "css/main.css";
import "css/moderation.css";

export { ModCommands, COMMAND_COLOR } from "./Moderation/ModCommands";

export default function Moderation() {
  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [results, setResults] = useState("");

  useEffect(() => {
    document.title = "Moderation | UltiMafia";

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
      <Box sx={{ p: 1 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Mission Statement
        </Typography>
        <Typography>
          UltiMafia seeks to create an inclusive and welcoming space for playing
          chat-based Mafia and related minigames. Our goal is to provide a fair
          and respectful environment where all players can enjoy the game free
          from hostility. We are dedicated to maintaining a community free from
          prejudice or bias based on sex, age, gender identity, sexual
          orientation, skin color, ability, religion, nationality, or any other
          characteristic.{" "}
        </Typography>
      </Box>
      <Grid container rowSpacing={1} columnSpacing={1} className="moderation">
        <Grid item xs={12} key={"mission-statement"}></Grid>
        <Grid item xs={12} md={8} key={"execute-action"}>
          <Stack direction="column" spacing={1}>
            <Stack direction="column" spacing={1}>
              {user.perms.viewModActions && (
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
