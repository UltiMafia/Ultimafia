import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
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
import { getPageNavFilterArg, PageNav, SearchBar } from "components/Nav";
import { Time } from "components/Basic";

import { SiteInfoContext, UserContext } from "Contexts";
import {
  MaxBoardNameLength,
  MaxCategoryNameLength,
  MaxGroupNameLength,
  MaxBoardDescLength,
} from "Constants";

import { Badge, NameWithAvatar, StatusIcon } from "pages/User/User";
import { NewLoading } from "pages/Welcome/NewLoading";

import "css/main.css";
import "css/moderation.css";
import { useParams } from "react-router-dom";
import { lobbies } from "../../constants/lobbies";

const COMMAND_GROUP_ORDER = {
  "User Management": 1, // the lower the number, the higher it appears
  "Setup Management": 2,
  "Game Management": 3,
  "Site Management": 4,
  "Group Management": 5,
  "Poll Management": 6,
  "Deck Management": 9,
  "Forum Management": 99,
  "Chat Window Management": 999,
  Ungrouped: 9999,
};

export const COMMAND_COLOR = "#8A2BE2";

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
        <Typography variant="h4">
          {group.badge && (
            <Badge
              icon={group.badge}
              color={group.badgeColor || "black"}
              name={group.name}
            />
          )}
          {group.name + "s"}
        </Typography>
        <Grid container rowSpacing={1} columnSpacing={1}>
          {members}
        </Grid>
      </div>
    );
  });

  if (!loaded) return <NewLoading small />;

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

export function ModCommands(props) {
  const fixedHeight = props.fixedHeight || false;
  const prefilledArgs = props.prefilledArgs || {};
  const setCommandsAvailable = props.setCommandsAvailable;

  const [command, setCommand] = useState();
  const [searchVal, setSearchVal] = useState("");
  const [isDialogueOpen, setDialogueOpen] = useState(false);
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
          setDialogueOpen(true);
          setCommand(commandName);
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
      <Stack direction="column">
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
          sx={{
            borderRadius: "4px",
            backgroundColor: "var(--scheme-color)",
            color: "var(--scheme-color-text)",
            width: "100%",
          }}
        />
      );
    });

    args = args.map((arg) => {
      return (
        <Grid item xs={12} md={6} key={arg.key}>
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

export function useModCommands(argValues, commandRan, setResults) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  return {
    "Create Group": {
      perm: "createGroup",
      category: "Group Management",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxGroupNameLength,
        },
        {
          label: "Rank",
          name: "rank",
          type: "number",
          default: 0,
        },
        {
          label: "Badge",
          name: "badge",
          type: "text",
          optional: true,
        },
        {
          label: "Badge Color",
          name: "badgeColor",
          type: "text",
          optional: true,
        },
        {
          label: "Permissions",
          name: "permissions",
          type: "text",
          optional: true,
          isArray: true,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/group", argValues)
          .then(() => {
            siteInfo.showAlert("Group created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Group": {
      perm: "deleteGroup",
      category: "Group Management",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxGroupNameLength,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/group/delete", argValues)
          .then(() => {
            siteInfo.showAlert("Group deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Create Forum Category": {
      perm: "createCategory",
      category: "Forum Management",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxCategoryNameLength,
        },
        {
          label: "Rank",
          name: "rank",
          type: "number",
          default: 0,
        },
        {
          label: "Position",
          name: "position",
          type: "number",
          default: 0,
        },
      ],
      run: function () {
        axios
          .post("/api/forums/category", argValues)
          .then(() => {
            siteInfo.showAlert("Category created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Create Forum Board": {
      perm: "createBoard",
      category: "Forum Management",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxBoardNameLength,
        },
        {
          label: "Category",
          name: "category",
          type: "text",
          maxlength: MaxCategoryNameLength,
        },
        {
          label: "Description",
          name: "description",
          type: "text",
          maxlength: MaxBoardDescLength,
        },
        {
          label: "Icon",
          name: "icon",
          type: "text",
          optional: true,
        },
        {
          label: "Rank",
          name: "rank",
          type: "number",
          optional: true,
        },
        {
          label: "Position",
          name: "position",
          type: "number",
          optional: true,
        },
      ],
      run: function () {
        axios
          .post("/api/forums/board", argValues)
          .then(() => {
            siteInfo.showAlert("Board created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Update Group Permissions": {
      perm: "updateGroupPerms",
      category: "Group Management",
      args: [
        {
          label: "Group Name",
          name: "groupName",
          type: "text",
          maxlength: MaxGroupNameLength,
        },
        {
          label: "Permissions to Add",
          name: "addPermissions",
          type: "text",
          optional: true,
          isArray: true,
        },
        {
          label: "Permissions to Remove",
          name: "removePermissions",
          type: "text",
          optional: true,
          isArray: true,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/groupPerms", argValues)
          .then(() => {
            siteInfo.showAlert("Group permissions updated.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Add User to Group": {
      perm: "giveGroup",
      category: "Group Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Group Name",
          name: "groupName",
          type: "text",
          maxlength: MaxGroupNameLength,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/addToGroup", argValues)
          .then(() => {
            siteInfo.showAlert("User added to group.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Remove User from Group": {
      perm: "removeFromGroup",
      category: "Group Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Group Name",
          name: "groupName",
          type: "text",
          maxlength: MaxGroupNameLength,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/removeFromGroup", argValues)
          .then(() => {
            siteInfo.showAlert("User removed from group.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get Group Permissions": {
      perm: "viewPerms",
      category: "Group Management",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxGroupNameLength,
        },
      ],
      run: function () {
        axios
          .get(`/api/mod/groupPerms?name=${argValues.name}`)
          .then((res) => {
            alert(res.data.join(", "), "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get User Permissions": {
      perm: "viewPerms",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/api/mod/userPerms?userId=${argValues.userId}`)
          .then((res) => {
            alert(res.data.join(", "), "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Forum Board": {
      perm: "deleteBoard",
      category: "Forum Management",
      hidden: true,
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxBoardNameLength,
        },
      ],
      run: function () {
        axios
          .post("/api/forums/board/delete", argValues)
          .then(() => {
            siteInfo.showAlert("Board deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Move Forum Thread": {
      perm: "moveThread",
      category: "Forum Management",
      args: [
        {
          label: "Thread ID",
          name: "thread",
          type: "text",
        },
        {
          label: "Board Name",
          name: "board",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/forums/thread/move", argValues)
          .then(() => {
            siteInfo.showAlert("Thread moved.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Create Chat Room": {
      perm: "createRoom",
      category: "Chat Window Management",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
          maxlength: MaxBoardNameLength,
        },
        {
          label: "Position",
          name: "position",
          type: "number",
          optional: true,
        },
        {
          label: "Rank",
          name: "rank",
          type: "number",
          optional: true,
        },
      ],
      run: function () {
        axios
          .post("/api/chat/room", argValues)
          .then(() => {
            siteInfo.showAlert("Room created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Chat Room": {
      perm: "deleteRoom",
      category: "Chat Window Management",
      args: [
        {
          label: "Room Name",
          name: "name",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/chat/room/delete", argValues)
          .then(() => {
            siteInfo.showAlert("Room deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Forum Ban": {
      perm: "forumBan",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/forumBan", argValues)
          .then(() => {
            siteInfo.showAlert("User forum banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Chat Ban": {
      perm: "chatBan",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/chatBan", argValues)
          .then(() => {
            siteInfo.showAlert("User chat banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Game Ban": {
      perm: "gameBan",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/gameBan", argValues)
          .then(() => {
            siteInfo.showAlert("User game banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ranked Ban": {
      perm: "rankedBan",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/rankedBan", argValues)
          .then(() => {
            siteInfo.showAlert("User ranked banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Competitive Ban": {
      perm: "competitiveBan",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/competitiveBan", argValues)
          .then(() => {
            siteInfo.showAlert("User competitive banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Site Ban": {
      perm: "siteBan",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/siteBan", argValues)
          .then(() => {
            siteInfo.showAlert("User site banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Force Sign Out": {
      perm: "forceSignOut",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/logout", argValues)
          .then(() => {
            siteInfo.showAlert("User logged out.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Forum Unban": {
      perm: "forumUnban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/forumUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User forum unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Chat Unban": {
      perm: "chatUnban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/chatUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User chat unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Game Unban": {
      perm: "gameUnban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/gameUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User game unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ranked Unban": {
      perm: "rankedUnban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/rankedUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User ranked unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Competitive Unban": {
      perm: "competitiveUnban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/competitiveUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User competitive unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Site Unban": {
      perm: "siteUnban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/siteUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User site unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get IP Addresses": {
      perm: "viewIPs",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/api/mod/ips?userId=${argValues.userId}`)
          .then((res) => {
            setResults("test");
            //setResults(res.data.join(" "));
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get Alt Accounts": {
      perm: "viewAlts",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/api/mod/alts?userId=${argValues.userId}`)
          .then((res) => {
            alert(res.data.map((u) => `${u.name} (${u.id})`).join(", "));
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get Bans": {
      perm: "viewBans",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/api/mod/bans?userId=${argValues.userId}`)
          .then((res) => {
            alert(
              res.data
                .map(
                  (ban) =>
                    `Type: ${ban.type}, mod: ${ban.modId}, expires: ${new Date(
                      ban.expires
                    ).toLocaleString()}`
                )
                .join("\n")
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Check Flagged": {
      perm: "viewFlagged",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/api/mod/flagged?userId=${argValues.userId}`)
          .then((res) => {
            if (res.data) alert("Flagged!");
            else alert("Not flagged");

            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Setup Name": {
      perm: "clearSetupName",
      category: "Setup Management",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/clearSetupName", argValues)
          .then(() => {
            siteInfo.showAlert("Setup name cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear User Content": {
      perm: "clearUserContent",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Content Type",
          name: "contentType",
          type: "select",
          options: [
            { value: "avatar", label: "Avatar" },
            { value: "bio", label: "Bio" },
            { value: "birthday", label: "Birthday" },
            { value: "customEmotes", label: "Custom Emotes" },
            { value: "name", label: "Name" },
            { value: "vanityUrl", label: "Vanity URL" },
            { value: "video", label: "Video" },
            { value: "pronouns", label: "Pronouns" },
            { value: "accountDisplay", label: "Account Display" },
            { value: "all", label: "All User Content" },
          ],
        },
      ],
      run: function () {
        axios
          .post("/api/mod/clearUserContent", argValues)
          .then(() => {
            siteInfo.showAlert("User content cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Change Name": {
      perm: "changeUsersName",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "New Name",
          name: "name",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/changeName", argValues)
          .then(() => {
            siteInfo.showAlert("Name changed.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Refund Game": {
      perm: "refundGame",
      category: "Game Management",
      args: [
        {
          label: "Game ID",
          name: "gameId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/refundGame", argValues)
          .then((res) => {
            siteInfo.showAlert(res.data || "Game refunded.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Break Game": {
      perm: "breakGame",
      category: "Game Management",
      args: [
        {
          label: "Game Id",
          name: "gameId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/breakGame", argValues)
          .then(() => {
            siteInfo.showAlert("Game broken.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Featured Setup": {
      perm: "featureSetup",
      category: "Setup Management",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/setup/feature", argValues)
          .then(() => {
            siteInfo.showAlert("Setup feature toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Featured Deck": {
      perm: "featureSetup",
      category: "Deck Management",
      args: [
        {
          label: "Deck Id",
          name: "deckId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/deck/feature", argValues)
          .then(() => {
            siteInfo.showAlert("deck feature toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Setup": {
      perm: "deleteSetup",
      category: "Setup Management",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/setup/delete", { id: argValues["setupId"] })
          .then(() => {
            siteInfo.showAlert("Setup deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Disable Deck": {
      perm: "disableDeck",
      category: "Deck Management",
      args: [
        {
          label: "Deck Id",
          name: "deckId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/deck/disable", argValues)
          .then(() => {
            siteInfo.showAlert("Toggled deck disable status", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear All IPs": {
      perm: "clearAllIPs",
      category: "Site Management",
      args: [],
      run: function () {
        axios
          .post("/api/mod/clearAllIPs", argValues)
          .then(() => {
            siteInfo.showAlert("IPs cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    Whitelist: {
      perm: "whitelist",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/whitelist", argValues)
          .then(() => {
            siteInfo.showAlert("User whitelisted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    Blacklist: {
      perm: "whitelist",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/blacklist", argValues)
          .then(() => {
            siteInfo.showAlert("User blacklisted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Kick Player": {
      perm: "kick",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/kick", argValues)
          .then(() => {
            siteInfo.showAlert("Kicked player.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Make Announcement": {
      perm: "announce",
      category: "Site Management",
      args: [
        {
          label: "Content",
          name: "content",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/announcement", argValues)
          .then(() => {
            siteInfo.showAlert("Announcement created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Ranked Setup": {
      perm: "approveRanked",
      category: "Setup Management",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/setup/ranked", argValues)
          .then(() => {
            siteInfo.showAlert("Setup ranked status toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Competitive Setup": {
      perm: "approveCompetitive",
      category: "Setup Management",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/setup/competitive", argValues)
          .then(() => {
            siteInfo.showAlert("Setup competitive status toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ranked Approve": {
      perm: "approveRanked",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/rankedApprove", argValues)
          .then(() => {
            siteInfo.showAlert("User approved for ranked play.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Competitive Approve": {
      perm: "approveCompetitive",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/competitiveApprove", argValues)
          .then(() => {
            siteInfo.showAlert(
              "User approved for competitive play.",
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Update Board Description": {
      hidden: true,
      args: [
        {
          label: "Name",
        },
      ],
    },
    "Delete Forum Thread": {
      hidden: true,
      args: [
        {
          label: "Thread ID",
        },
      ],
    },
    "Restore Forum Thread": {
      hidden: true,
      args: [
        {
          label: "Thread ID",
        },
      ],
    },
    "Toggle Forum Thread Pin": {
      hidden: true,
      args: [
        {
          label: "Thread ID",
        },
      ],
    },
    "Toggle Forum Thread Lock": {
      hidden: true,
      args: [
        {
          label: "Thread ID",
        },
      ],
    },
    "Delete Forum Reply": {
      hidden: true,
      args: [
        {
          label: "Reply ID",
        },
      ],
    },
    "Restore Forum Reply": {
      hidden: true,
      args: [
        {
          label: "Reply ID",
        },
      ],
    },
    "Delete Comment": {
      hidden: true,
      args: [
        {
          label: "Comment ID",
        },
      ],
    },
    "Restore Comment": {
      hidden: true,
      args: [
        {
          label: "Comment ID",
        },
      ],
    },
    "Create Poll": {
      perm: "createPoll",
      category: "Poll Management",
      args: [
        {
          label: "Lobby",
          name: "lobby",
          type: "select",
          options: lobbies
            .filter((lobby) => !lobby.disabled && lobby.name !== "All")
            .map((lobby) => ({
              value: lobby.name,
              label: lobby.displayName,
            })),
        },
        {
          label: "Question",
          name: "question",
          type: "text",
        },
        {
          label: "Options (comma-separated)",
          name: "options",
          type: "text",
          isArray: true,
        },
        {
          label: "Expires in",
          name: "expiration",
          type: "text",
          optional: true,
        },
      ],
      run: function () {
        axios
          .post("/api/poll/create", argValues)
          .then(() => {
            siteInfo.showAlert("Poll created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
  };
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

function ModActions(props) {
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
