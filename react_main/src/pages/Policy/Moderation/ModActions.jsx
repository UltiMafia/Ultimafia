import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Stack, Typography } from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { Time } from "components/Basic";
import { NameWithAvatar } from "pages/User/User";

import { COMMAND_COLOR, useModCommands } from "./commands";

export function ModActions(props) {
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState([]);

  const modCommands = useModCommands({}, () => {}, props.setResults);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, actions, "date");

    if (filterArg == null) return;

    axios
      .get(`/api/mod/actions?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setActions(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const actionRows = actions.map((action) => {
    if (!(action.name in modCommands)) {
      console.error(
        `Not displaying action ${action.name} because it isn't listed in modCommands. Please report this error.`
      );
      return <></>;
    }

    let command = modCommands[action.name];
    let actionArgs = action.args.map((arg, i) => (
      <ModActionArg
        label={command.args[i]?.label || "Unknown"}
        arg={arg}
        key={i}
      />
    ));

    return (
      <Stack
        direction="column"
        spacing={0.5}
        key={action.id}
        sx={{
          p: 1,
          backgroundColor: "var(--scheme-color)",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
          }}
        >
          <NameWithAvatar
            id={action.mod.id}
            name={action.mod.name}
            avatar={action.mod.avatar}
          />
          <Typography
            variant="caption"
            sx={{
              opacity: "0.6",
              marginLeft: "auto !important",
              alignSelf: "start",
            }}
          >
            <Time minSec millisec={Date.now() - action.date} suffix=" ago" />
          </Typography>
        </Stack>
        <Typography
          sx={{
            display: "inline",
            fontFamily: "RobotoMono",
            fontSize: "16px",
            textAlign: "center",
            backgroundColor: COMMAND_COLOR,
          }}
        >
          {action.name}
        </Typography>
        {actionArgs}
      </Stack>
    );
  });

  const pageNav = (
    <Box sx={{ alignSelf: "center" }}>
      <PageNav page={page} onNav={onPageNav} />
    </Box>
  );

  return (
    <div className="box-panel">
      <Typography variant="h3">Mod Actions</Typography>
      <Stack direction="column" spacing={1}>
        {pageNav}
        {actionRows}
        {pageNav}
      </Stack>
    </div>
  );
}

function ModActionArg({ label, arg }) {
  var value = null;
  const [userInfo, setUserInfo] = useState(null);

  useEffect(
    async function () {
      if (label === "User") {
        try {
          const res = await axios.get(`/api/user/${arg}/info`);
          setUserInfo(res.data);
        } catch (e) {
          setUserInfo({
            id: arg,
            name: `[not found: ${arg}]`,
            avatar: false,
          });
        }
      }
    },
    [label, arg]
  );

  if (userInfo) {
    value = (
      <Box
        sx={{
          display: "inline-block",
        }}
      >
        <NameWithAvatar
          id={userInfo.id}
          name={userInfo.name}
          avatar={userInfo.avatar}
          small
        />
      </Box>
    );
  } else {
    value = (
      <Typography
        sx={{
          display: "inline",
          fontFamily: "RobotoMono",
          color: "#28ab48ff",
        }}
      >
        {arg}
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1}>
      <Typography
        sx={{
          display: "inline",
          fontFamily: "RobotoMono",
        }}
      >
        {label}
        {":"}
      </Typography>
      {value}
    </Stack>
  );
}
