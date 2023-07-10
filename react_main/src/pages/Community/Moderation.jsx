import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import update from "immutability-helper";

import { useErrorAlert } from "../../components/Alerts";
import { SearchSelect, UserSearchSelect } from "../../components/Form";
import { SiteInfoContext, UserContext } from "../../Contexts";
import { Badge, NameWithAvatar, StatusIcon } from "../User/User";
import LoadingPage from "../Loading";
import {
  MaxBoardNameLength,
  MaxCategoryNameLength,
  MaxGroupNameLength,
  MaxBoardDescLength,
} from "../../Constants";

import "../../css/moderation.css";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";
import { Link } from "react-router-dom";

export default function Moderation() {
  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Moderation | UltiMafia";

    axios
      .get("/mod/groups")
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
      <div className="member user-cell" key={member.id}>
        <NameWithAvatar
          id={member.id}
          name={member.name}
          avatar={member.avatar}
        />
        <StatusIcon status={member.status} />
      </div>
    ));

    return (
      <div className="span-panel group-panel" key={group.name}>
        <div className="title">
          {group.badge && (
            <Badge
              icon={group.badge}
              color={group.badgeColor || "black"}
              name={group.name}
            />
          )}
          {group.name + "s"}
        </div>
        <div className="members">{members}</div>
      </div>
    );
  });

  if (!loaded) return <LoadingPage />;

  return (
    <div className="moderation">
      <div className="main-section">
        {user.perms.viewModActions && (
          <div className="span-panel action-panel">
            <div className="title">Do Action</div>
            <ModCommands />
          </div>
        )}
        {groupsPanels}
      </div>
      <div className="side-column">
        <ModActions />
      </div>
    </div>
  );
}

function ModCommands() {
  const [command, setCommand] = useState();
  const [argValues, setArgValues] = useState({});
  const modCommands = useModCommands(argValues, commandRan);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  var options = [];
  var args = [];

  for (let commandName in modCommands)
    if (
      user.perms[modCommands[commandName].perm] &&
      !modCommands[commandName].hidden
    )
      options.push(commandName);

  if (command) {
    args = modCommands[command].args.map((arg) => {
      var placeholder = arg.label;

      if (arg.default != null) placeholder = `${placeholder} (${arg.default})`;
      else if (arg.optional) placeholder = `[${placeholder}]`;

      if (arg.type == "user_search") {
        return (
          <UserSearchSelect
            value={argValues[arg.name] || ""}
            setValue={(value) => updateArgValue(arg.name, value, arg.isArray)}
            placeholder={placeholder}
            key={arg.name}
          />
        );
      }

      return (
        <input
          className="arg"
          type={arg.type}
          placeholder={placeholder}
          maxLength={arg.maxlength}
          onChange={(e) =>
            updateArgValue(arg.name, e.target.value, arg.isArray)
          }
          key={arg.name}
        />
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
    setArgValues({});
  }

  function onRunClick() {
    for (let arg of modCommands[command].args) {
      if (argValues[arg.name] == null) {
        if (arg.default != null) argValues[arg.name] = arg.default;
        else if (!arg.optional) {
          errorAlert("Missing arguments.");
          return;
        }
      }
    }

    modCommands[command].run();
  }

  return (
    <div className="mod-commands">
      <div className="inputs">
        <SearchSelect options={options} value={command} setValue={setCommand} />
        {args}
      </div>
      {command && (
        <div className="btn btn-theme-sec submit" onClick={onRunClick}>
          Run
        </div>
      )}
    </div>
  );
}

function useModCommands(argValues, commandRan) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  return {
    "Create Group": {
      perm: "createGroup",
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
          .post("/mod/group", argValues)
          .then(() => {
            siteInfo.showAlert("Group created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Group": {
      perm: "deleteGroup",
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
          .post("/mod/group/delete", argValues)
          .then(() => {
            siteInfo.showAlert("Group deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Create Forum Category": {
      perm: "createCategory",
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
          .post("/forums/category", argValues)
          .then(() => {
            siteInfo.showAlert("Category created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Create Forum Board": {
      perm: "createBoard",
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
          .post("/forums/board", argValues)
          .then(() => {
            siteInfo.showAlert("Board created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Update Group Permissions": {
      perm: "updateGroupPerms",
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
          .post("/mod/groupPerms", argValues)
          .then(() => {
            siteInfo.showAlert("Group permissions updated.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Add User to Group": {
      perm: "giveGroup",
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
          .post("/mod/addToGroup", argValues)
          .then(() => {
            siteInfo.showAlert("User added to group.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Remove User from Group": {
      perm: "removeFromGroup",
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
          .post("/mod/removeFromGroup", argValues)
          .then(() => {
            siteInfo.showAlert("User removed from group.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get Group Permissions": {
      perm: "viewPerms",
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
          .get(`/mod/groupPerms?name=${argValues.name}`)
          .then((res) => {
            alert(res.data.join(", "), "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get User Permissions": {
      perm: "viewPerms",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/mod/userPerms?userId=${argValues.userId}`)
          .then((res) => {
            alert(res.data.join(", "), "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Forum Board": {
      perm: "deleteBoard",
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
          .post("/forums/board/delete", argValues)
          .then(() => {
            siteInfo.showAlert("Board deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Move Forum Thread": {
      perm: "moveThread",
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
          .post("/forums/thread/move", argValues)
          .then(() => {
            siteInfo.showAlert("Thread moved.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Create Chat Room": {
      perm: "createRoom",
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
          .post("/chat/room", argValues)
          .then(() => {
            siteInfo.showAlert("Room created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Chat Room": {
      perm: "deleteRoom",
      args: [
        {
          label: "Room Name",
          name: "name",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/chat/room/delete", argValues)
          .then(() => {
            siteInfo.showAlert("Room deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Forum Ban": {
      perm: "forumBan",
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
          .post("/mod/forumBan", argValues)
          .then(() => {
            siteInfo.showAlert("User forum banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Chat Ban": {
      perm: "chatBan",
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
          .post("/mod/chatBan", argValues)
          .then(() => {
            siteInfo.showAlert("User chat banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Game Ban": {
      perm: "gameBan",
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
          .post("/mod/gameBan", argValues)
          .then(() => {
            siteInfo.showAlert("User game banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ranked Ban": {
      perm: "rankedBan",
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
          .post("/mod/rankedBan", argValues)
          .then(() => {
            siteInfo.showAlert("User ranked banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Site Ban": {
      perm: "siteBan",
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
          .post("/mod/siteBan", argValues)
          .then(() => {
            siteInfo.showAlert("User site banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Force Sign Out": {
      perm: "forceSignOut",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/logout", argValues)
          .then(() => {
            siteInfo.showAlert("User logged out.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Forum Unban": {
      perm: "forumUnban",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/forumUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User forum unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Chat Unban": {
      perm: "chatUnban",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/chatUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User chat unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Game Unban": {
      perm: "gameUnban",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/gameUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User game unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ranked Unban": {
      perm: "rankedUnban",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/rankedUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User ranked unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Site Unban": {
      perm: "siteUnban",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/siteUnban", argValues)
          .then(() => {
            siteInfo.showAlert("User site unbanned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get Alt Accounts": {
      perm: "viewAlts",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/mod/alts?userId=${argValues.userId}`)
          .then((res) => {
            alert(res.data.map((u) => `${u.name} (${u.id})`).join(", "));
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Get Bans": {
      perm: "viewBans",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/mod/bans?userId=${argValues.userId}`)
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
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .get(`/mod/flagged?userId=${argValues.userId}`)
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
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearSetupName", argValues)
          .then(() => {
            siteInfo.showAlert("Setup name cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Bio": {
      perm: "clearBio",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearBio", argValues)
          .then(() => {
            siteInfo.showAlert("Bio cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Video": {
      perm: "clearBio",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearVideo", argValues)
          .then(() => {
            siteInfo.showAlert("Video cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Birthday": {
      perm: "clearBio",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearBirthday", argValues)
          .then(() => {
            siteInfo.showAlert("Birthday cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Account Display": {
      perm: "clearAccountDisplay",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearAccountDisplay", argValues)
          .then(() => {
            siteInfo.showAlert("Account display cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Name": {
      perm: "clearName",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearName", argValues)
          .then(() => {
            siteInfo.showAlert("Name cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Avatar": {
      perm: "clearAvi",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearAvi", argValues)
          .then(() => {
            siteInfo.showAlert("Avatar cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear All User Content": {
      perm: "clearAllUserContent",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/clearAllContent", argValues)
          .then(() => {
            siteInfo.showAlert("User content cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Change Name": {
      perm: "changeName",
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
          .post("/mod/changeName", argValues)
          .then(() => {
            siteInfo.showAlert("Name changed.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Give Coins": {
      perm: "giveCoins",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Amount",
          name: "amount",
          type: "number",
        },
      ],
      run: function () {
        axios
          .post("/mod/giveCoins", argValues)
          .then(() => {
            siteInfo.showAlert("Coins given.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Break Game": {
      perm: "breakGame",
      args: [
        {
          label: "Game Id",
          name: "gameId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/mod/breakGame", argValues)
          .then(() => {
            siteInfo.showAlert("Game broken.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Featured Setup": {
      perm: "featureSetup",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/setup/feature", argValues)
          .then(() => {
            siteInfo.showAlert("Setup feature toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Featured Deck": {
      perm: "featureSetup",
      args: [
        {
          label: "Deck Id",
          name: "deckId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/deck/feature", argValues)
          .then(() => {
            siteInfo.showAlert("deck feature toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Setup": {
      perm: "deleteSetup",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/setup/delete", { id: argValues["setupId"] })
          .then(() => {
            siteInfo.showAlert("Setup deleted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Disable Deck": {
      perm: "disableDeck",
      args: [
        {
          label: "Deck Id",
          name: "deckId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/deck/disable", argValues)
          .then(() => {
            siteInfo.showAlert("Toggled deck disable status", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear All IPs": {
      perm: "clearAllIPs",
      args: [],
      run: function () {
        axios
          .post("/mod/clearAllIPs", argValues)
          .then(() => {
            siteInfo.showAlert("IPs cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    Whitelist: {
      perm: "whitelist",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/whitelist", argValues)
          .then(() => {
            siteInfo.showAlert("User whitelisted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    Blacklist: {
      perm: "whitelist",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/blacklist", argValues)
          .then(() => {
            siteInfo.showAlert("User blacklisted.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Schedule Restart": {
      perm: "scheduleRestart",
      args: [
        {
          label: "When",
          name: "when",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/mod/scheduleRestart", argValues)
          .then(() => {
            siteInfo.showAlert("Restart scheduled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Kick Player": {
      perm: "kick",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/kick", argValues)
          .then(() => {
            siteInfo.showAlert("Kicked player.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Break Port Games": {
      perm: "breakPortGames",
      args: [
        {
          label: "Port",
          name: "port",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/mod/breakPortGames", argValues)
          .then(() => {
            siteInfo.showAlert("Games broken.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Make Announcement": {
      perm: "announce",
      args: [
        {
          label: "Content",
          name: "content",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/mod/announcement", argValues)
          .then(() => {
            siteInfo.showAlert("Announcement created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Block Name": {
      perm: "blockName",
      args: [
        {
          label: "Name",
          name: "name",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/mod/blockName", argValues)
          .then(() => {
            siteInfo.showAlert("Name blocked.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Ranked Setup": {
      perm: "approveRanked",
      args: [
        {
          label: "Setup Id",
          name: "setupId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/setup/ranked", argValues)
          .then(() => {
            siteInfo.showAlert("Setup ranked status toggled.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ranked Approve": {
      perm: "approveRanked",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/mod/rankedApprove", argValues)
          .then(() => {
            siteInfo.showAlert("User approved for ranked play.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Delete Forum Board": {
      hidden: true,
      args: [
        {
          label: "Name",
        },
      ],
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
  };
}

function ModActions(props) {
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState([]);

  const modCommands = useModCommands({}, () => {});
  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, actions, "date");

    if (filterArg == null) return;

    axios
      .get(`/mod/actions?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setActions(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const actionRows = actions.map((action) => {
    let command = modCommands[action.name];
    let actionArgs = action.args.map((arg, i) => {
      let label = command.args[i].label;

      if (label == "User") arg = <Link to={`/user/${arg}`}>{arg}</Link>;

      return (
        <div className="action-arg" key={i}>
          {label}: {arg}
        </div>
      );
    });

    return (
      <div className="action" key={action.id}>
        <div className="top-row">
          <NameWithAvatar
            id={action.mod.id}
            name={action.mod.name}
            avatar={action.mod.avatar}
          />
          <div className="date">
            <Time minSec millisec={Date.now() - action.date} suffix=" ago" />
          </div>
        </div>
        <div className="action-name">{action.name}</div>
        <div className="action-args">{actionArgs}</div>
      </div>
    );
  });

  return (
    <div className="box-panel">
      <div className="heading">Mod Actions</div>
      <div className="actions-wrapper">
        <PageNav page={page} onNav={onPageNav} />
        {actionRows}
        <PageNav page={page} onNav={onPageNav} />
      </div>
    </div>
  );
}
