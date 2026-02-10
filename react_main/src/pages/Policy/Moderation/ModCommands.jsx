import React, { useState, useContext } from "react";
import update from "immutability-helper";
import {
  Dialog,
  DialogContent,
  Typography,
  Grid,
  Stack,
  TextField,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { UserSearchSelect } from "components/Form";
import { SearchBar } from "components/Nav";
import { UserContext } from "Contexts";

import ManageSeasonDialog from "./ManageSeasonDialog";
import {
  COMMAND_COLOR,
  COMMAND_GROUP_ORDER,
  useModCommands,
} from "./commands";

import "css/main.css";
import "css/moderation.css";
import { useParams } from "react-router-dom";

export { COMMAND_COLOR };

export function ModCommands(props) {
  const fixedHeight = props.fixedHeight || false;
  const prefilledArgs = props.prefilledArgs || {};
  const setCommandsAvailable = props.setCommandsAvailable;

  const [command, setCommand] = useState();
  const [searchVal, setSearchVal] = useState("");
  const [isDialogueOpen, setDialogueOpen] = useState(false);
  const [isManageSeasonDialogOpen, setIsManageSeasonDialogOpen] =
    useState(false);
  const [argValues, setArgValues] = useState(prefilledArgs);

  const { userId } = useParams();
  const { gameId } = useParams();
  const { setupId } = useParams();

  const errorAlert = useErrorAlert();
  const user = useContext(UserContext);
  const modCommands = useModCommands(argValues, commandRan, props.setResults);

  function closeDialogue() {
    setArgValues(prefilledArgs);
    setDialogueOpen(false);
  }

  var args = [];

  // First group by category
  var groupedOptions = {};
  for (let commandName in modCommands) {
    const command = modCommands[commandName];
    const category = command.category || "Ungrouped";
    const argNames = command.args.map((arg) => arg.name);

    // Skip actions that aren't "contextual" to the page that we're on
    if (userId && !argNames.includes("userId")) continue;
    if (gameId && !argNames.includes("gameId")) continue;
    if (setupId && !argNames.includes("setupId")) continue;

    if (!groupedOptions.hasOwnProperty(category)) groupedOptions[category] = [];
    groupedOptions[category].push(commandName);
  }

  // Next sort the individual commands alphabetically by their name
  for (let category in groupedOptions) {
    groupedOptions[category].sort();
  }

  // Sort groups by how userful they are
  var groupOptionKeys = Object.keys(groupedOptions);
  groupOptionKeys.sort((a, b) => {
    const aVal = COMMAND_GROUP_ORDER[a] || 99999;
    const bVal = COMMAND_GROUP_ORDER[b] || 99999;

    if (!COMMAND_GROUP_ORDER.hasOwnProperty(a))
      console.error(`Got unknown category: ${a}`);
    if (!COMMAND_GROUP_ORDER.hasOwnProperty(b))
      console.error(`Got unknown category: ${b}`);

    if (aVal < bVal) {
      return -1;
    } else if (aVal > bVal) {
      return 1;
    }
    return 0;
  });

  // Let the parent know that commands are available if needed
  if (setCommandsAvailable) setCommandsAvailable(false);

  // Finally, do a nested map of group -> option
  const options = groupOptionKeys.map((category) => {
    const groupOptions = groupedOptions[category]
      .map((commandName) => {
        const userHasPermission = user.perms[modCommands[commandName].perm];
        const matchesSearch =
          !searchVal || commandName.toLowerCase().includes(searchVal);

        function openDialogue() {
          const cmd = modCommands[commandName];
          if (cmd.customDialog) {
            setIsManageSeasonDialogOpen(true);
            setCommand(commandName);
          } else {
            setDialogueOpen(true);
            setCommand(commandName);
          }
        }

        if (
          userHasPermission &&
          matchesSearch &&
          !modCommands[commandName].hidden
        ) {
          if (setCommandsAvailable) setCommandsAvailable(true);
          return (
            <Typography
              onClick={openDialogue}
              key={commandName}
              tabindex="0"
              sx={{
                pl: 1,
                userSelect: "none",
                fontFamily: "RobotoMono",
                "&:hover": {
                  backgroundColor: COMMAND_COLOR,
                  cursor: "pointer",
                },
              }}
            >
              {commandName}
            </Typography>
          );
        } else {
          return null;
        }
      })
      .filter((groupOption) => groupOption != null);

    if (groupOptions.length == 0) return <></>;

    return (
      <Stack direction="column" key={category}>
        <Typography
          sx={{
            my: 1,
            fontSize: "18px",
            fontWeight: "500",
            userSelect: "none",
          }}
        >
          {category}
        </Typography>
        <Box>{groupOptions}</Box>
      </Stack>
    );
  });

  if (command) {
    args = modCommands[command].args.map((arg) => {
      var placeholder = arg.label;
      const argValue = argValues[arg.name];
      const isPrefilled = prefilledArgs.hasOwnProperty(arg.name);

      if (arg.default != null) placeholder = `${placeholder} (${arg.default})`;
      else if (arg.optional) placeholder = `[${placeholder}]`;

      if (arg.type === "user_search") {
        if (isPrefilled) {
          return (
            <TextField
              defaultValue={argValue}
              disabled
              key={arg.name}
              sx={{ width: "100%" }}
            />
          );
        } else {
          return (
            <UserSearchSelect
              onChange={(value) => {
                updateArgValue(arg.name, value, arg.isArray);
              }}
              placeholder={placeholder}
              key={arg.name}
            />
          );
        }
      }

      if (arg.type === "select") {
        return (
          <FormControl key={arg.name} sx={{ width: "100%" }}>
            <InputLabel>{arg.label}</InputLabel>
            <Select
              value={argValue || ""}
              label={arg.label}
              onChange={(e) =>
                updateArgValue(arg.name, e.target.value, arg.isArray)
              }
              disabled={isPrefilled}
            >
              {arg.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }

      return (
        <TextField
          value={argValue || ""}
          placeholder={placeholder}
          disabled={isPrefilled}
          onChange={(e) =>
            updateArgValue(arg.name, e.target.value, arg.isArray)
          }
          key={arg.name}
          multiline={arg.multiline || false}
          rows={arg.multiline ? 4 : 1}
          sx={{
            borderRadius: "4px",
            backgroundColor: "var(--scheme-color)",
            color: "var(--scheme-color-text)",
            width: "100%",
          }}
        />
      );
    });

    args = args.map((arg, index) => {
      return (
        <Grid item xs={12} md={6} key={arg.key ?? `arg-${index}`}>
          {arg}
        </Grid>
      );
    });
  }

  function updateArgValue(name, value, isArray) {
    if (isArray) value = value.split(/ *, */);

    setArgValues(
      update(argValues, {
        [name]: {
          $set: value,
        },
      })
    );
  }

  function commandRan() {
    setCommand(null);
    setArgValues(prefilledArgs);
  }

  function onSearchInput(query) {
    setSearchVal(query.toLowerCase());
  }

  function onExecute() {
    for (let arg of modCommands[command].args) {
      if (argValues[arg.name] == null) {
        if (arg.default != null) argValues[arg.name] = arg.default;
        else if (!arg.optional) {
          errorAlert(`Missing arguments: ${arg.name}`);
          return;
        }
      }
    }

    modCommands[command].run();
    closeDialogue();
  }

  return (
    <Stack direction="column" spacing={1} key="mod-commands">
      {command === "Manage Competitive Season Setups" && (
        <ManageSeasonDialog
          open={isManageSeasonDialogOpen}
          onClose={() => {
            setIsManageSeasonDialogOpen(false);
            setCommand(null);
          }}
          modCommands={modCommands}
          commandRan={commandRan}
        />
      )}
      <Dialog open={isDialogueOpen} onClose={closeDialogue} fullWidth>
        <DialogContent
          sx={{
            px: 1,
            minHeight: "240px",
          }}
        >
          <Stack direction="column" spacing={1}>
            <Stack direction="row">
              <Button onClick={onExecute}>Execute</Button>
              <Button
                variant="outlined"
                onClick={() => setDialogueOpen(false)}
                sx={{
                  marginLeft: "auto",
                }}
              >
                Cancel
              </Button>
            </Stack>
            <Typography
              sx={{
                fontFamily: "RobotoMono",
                fontSize: "16px",
                backgroundColor: COMMAND_COLOR,
                textAlign: "center",
              }}
            >
              {command}
            </Typography>
          </Stack>
          {args.length > 0 && (
            <Grid container spacing={1} sx={{ mt: 0 }}>
              {args}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
      <Stack
        direction="column"
        spacing={1}
        sx={{
          p: 1,
          width: "100%",
          height: fixedHeight ? undefined : "100%",
          backgroundColor: "var(--scheme-color)",
        }}
      >
        <SearchBar
          value={searchVal}
          placeholder="🔎 Command Name"
          onInput={onSearchInput}
        />
        <Stack
          direction="column"
          sx={{
            height: fixedHeight ? "360px" : undefined,
            overflowY: fixedHeight ? "scroll" : undefined,
          }}
        >
          {options}
        </Stack>
      </Stack>
    </Stack>
  );
}
