import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Autocomplete,
  Box,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { Time } from "components/Basic";
import { NameWithAvatar } from "pages/User/User";

import { COMMAND_COLOR, useModCommands } from "./commands";

export function ModActions(props) {
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState([]);
  const [staffNameFilter, setStaffNameFilter] = useState("");
  const [staffNameQuery, setStaffNameQuery] = useState("");
  const [staffNameOptions, setStaffNameOptions] = useState([]);
  const [staffIdMap, setStaffIdMap] = useState({});
  const [actionTypeFilter, setActionTypeFilter] = useState("");

  const modCommands = useModCommands({}, () => {}, props.setResults);
  const errorAlert = useErrorAlert();

  const actionTypeOptions = Object.keys(modCommands).sort();

  useEffect(() => {
    loadActions(1);
  }, [staffNameFilter, actionTypeFilter]);

  useEffect(() => {
    if (staffNameQuery.length === 0) {
      setStaffNameOptions([]);
      return;
    }

    axios
      .get(`/api/user/searchName?query=${staffNameQuery}`)
      .then((res) => {
        const newIdMap = {};
        for (let userData of res.data) {
          newIdMap[userData.name] = userData.id;
        }
        setStaffIdMap(newIdMap);
        setStaffNameOptions(res.data.map((user) => user.name));
      })
      .catch(errorAlert);
  }, [staffNameQuery]);

  function loadActions(_page) {
    const params = new URLSearchParams();

    if (_page > 1 && actions.length > 0) {
      params.append("last", actions[actions.length - 1].date);
    }

    if (staffNameFilter) {
      params.append("staffName", staffNameFilter);
    }
    if (actionTypeFilter) {
      params.append("actionType", actionTypeFilter);
    }

    axios
      .get(`/api/mod/actions?${params.toString()}`)
      .then((res) => {
        if (res.data.length > 0 || _page === 1) {
          setActions(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  function onPageNav(_page) {
    if (_page === page) return;

    const params = new URLSearchParams();

    if (_page > page && actions.length > 0) {
      params.append("last", actions[actions.length - 1].date);
    } else if (_page < page && actions.length > 0) {
      params.append("first", actions[0].date);
    }

    if (staffNameFilter) {
      params.append("staffName", staffNameFilter);
    }
    if (actionTypeFilter) {
      params.append("actionType", actionTypeFilter);
    }

    axios
      .get(`/api/mod/actions?${params.toString()}`)
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
      <Stack direction="column" spacing={2}>
        <Stack
          direction="column"
          spacing={2}
          sx={{ mb: 1 }}
        >
          <Autocomplete
            options={staffNameOptions}
            inputValue={staffNameQuery}
            onInputChange={(e, newValue) => {
              setStaffNameQuery(newValue);
            }}
            onChange={(e, newValue) => {
              setStaffNameFilter(newValue || "");
              setPage(1);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Staff Name"
                variant="outlined"
                size="small"
              />
            )}
            sx={{ width: 290 }}
            freeSolo
            clearOnEscape
          />
          <Autocomplete
            options={actionTypeOptions}
            value={actionTypeFilter || null}
            onChange={(e, newValue) => {
              setActionTypeFilter(newValue || "");
              setPage(1);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Action Type"
                variant="outlined"
                size="small"
              />
            )}
            sx={{ width: 290 }}
            clearOnEscape
          />
        </Stack>
        {pageNav}
        {actions.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: "center" }}>
            No actions found.
          </Typography>
        ) : (
          actionRows
        )}
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
