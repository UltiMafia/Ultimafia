import { createElement, useContext } from "react";
import axios from "axios";

import { useErrorAlert } from "components/Alerts";
import { SiteInfoContext } from "Contexts";
import {
  MaxBoardNameLength,
  MaxCategoryNameLength,
  MaxGroupNameLength,
  MaxBoardDescLength,
} from "Constants";
import { lobbies } from "../../../constants/lobbies";
import { BlockRequests } from "./BlockRequests";

// "N admins: accept a/k, deny d/j" for a ban appeal tally from the server.
function formatAppealTally(tally) {
  if (!tally.admins) return "0 admins: nobody can vote";
  const admins = `${tally.admins} admin${tally.admins === 1 ? "" : "s"}`;
  return `${admins}: accept ${tally.accept}/${tally.acceptAt}, deny ${tally.deny}/${tally.denyAt}`;
}

export const COMMAND_GROUP_ORDER = {
  "User Management": 1, // the lower the number, the higher it appears
  "Setup Management": 2,
  "Game Management": 3,
  "Site Management": 4,
  "Group Management": 5,
  "Family Management": 6,
  "Poll Management": 7,
  "Competitive Management": 8,
  "Deck Management": 9,
  "Forum Management": 99,
  "Chat Window Management": 999,
  Ungrouped: 9999,
};

export const COMMAND_COLOR = "#8A2BE2";

export function useModCommands(argValues, commandRan, setResults) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const commands = {
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
    "Clear Leave Penalty": {
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
          .post("/api/mod/clearleavepenalty", argValues)
          .then(() => {
            siteInfo.showAlert("Penalty Cleared.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Reset Birthday Limit": {
      perm: "resetBirthdayLimit",
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
          .post("/api/mod/resetBirthdayLimit", argValues)
          .then(() => {
            siteInfo.showAlert("Birthday limit reset.", "success");
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
    Ban: {
      perm: "ban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Ban Type",
          name: "banType",
          type: "select",
          options: [
            { value: "forum", label: "Forum" },
            { value: "chat", label: "Chat" },
            { value: "game", label: "Game" },
            { value: "ranked", label: "Ranked" },
            { value: "competitive", label: "Competitive" },
            { value: "site", label: "Site" },
          ],
        },
        {
          // Accounts linked by a shared IP or device fingerprint (see Alts).
          // The server also defaults to "linked" when this is missing.
          label: "Ban Scope",
          name: "scope",
          type: "select",
          options: [
            {
              value: "linked",
              label: "All linked accounts (shared IP or fingerprint)",
            },
            { value: "single", label: "This account only" },
          ],
          default: "linked",
        },
        {
          label: "Length",
          name: "length",
          type: "text",
        },
        {
          // Shown to the user on the ban page; the server requires it for
          // site bans.
          label: "Reason (required for site bans)",
          name: "reason",
          type: "text",
          optional: true,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/ban", argValues)
          .then(() => {
            siteInfo.showAlert("User banned.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    // Ban-page appeals: each admin the appeal went to (N) has one vote,
    // changeable while pending. min(2, N) accepts -> ACCEPTED; DENIED once
    // that is out of reach (denies > N - min(2, N)). Lifting the ban is a
    // separate Unban (Site).
    "Ban Appeal Vote": {
      perm: "unban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Vote",
          name: "vote",
          type: "select",
          options: [
            { value: "accept", label: "Accept" },
            { value: "deny", label: "Deny" },
          ],
        },
        {
          label: "Notes",
          name: "notes",
          type: "text",
          optional: true,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/banAppeal/vote", argValues)
          .then((res) => {
            const { status, tally } = res.data;
            siteInfo.showAlert(
              `Vote recorded. ${formatAppealTally(tally)}: ${status.toUpperCase()}.`,
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Ban Appeal Tally": {
      perm: "unban",
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
          .get("/api/mod/banAppeal", { params: { userId: argValues.userId } })
          .then((res) => {
            const { status, tally, votes } = res.data;
            const voteList = votes.length
              ? votes
                  .map((vote) => `${vote.voterName}: ${vote.vote.toUpperCase()}`)
                  .join(", ")
              : "no votes yet";
            siteInfo.showAlert(
              `${status.toUpperCase()}. ${formatAppealTally(tally)} (${voteList}).`,
              "info"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Give Permissions": {
      perm: "givePermissions",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Permissions (comma-separated)",
          name: "permissions",
          type: "text",
          isArray: true,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/givePerms", argValues)
          .then(() => {
            siteInfo.showAlert("Permissions updated.", "success");
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
    Unban: {
      perm: "unban",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Ban Type",
          name: "banType",
          type: "select",
          options: [
            { value: "forum", label: "Forum" },
            { value: "chat", label: "Chat" },
            { value: "game", label: "Game" },
            { value: "ranked", label: "Ranked" },
            { value: "competitive", label: "Competitive" },
            { value: "site", label: "Site" },
        {
          // Accounts linked by a shared IP or device fingerprint (see Alts).
          // The server also defaults to "linked" when this is missing.
          label: "Unban Scope",
          name: "scope",
          type: "select",
          options: [
            {
              value: "linked",
              label: "All linked accounts (shared IP or fingerprint)",
            },
            { value: "single", label: "This account only" },
          ],
          default: "linked",
        },
          ],
        },
      ],
      run: function () {
        axios
          .post("/api/mod/unban", argValues)
          .then(() => {
            siteInfo.showAlert("User unbanned.", "success");
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
    "Clear Setup Description": {
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
          .post("/api/mod/clearSetupDescription", argValues)
          .then(() => {
            siteInfo.showAlert("Setup description cleared.", "success");
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
            { value: "customEmotes", label: "Custom Emotes" },
            { value: "customStickers", label: "Custom Stickers" },
            { value: "deathSound", label: "Death Sound" },
            { value: "name", label: "Name" },
            { value: "vanityUrl", label: "Vanity URL" },
            { value: "video", label: "Video" },
            { value: "pronouns", label: "Pronouns" },
            { value: "donorBio", label: "Donor Bio" },
            { value: "profileBackground", label: "Profile Background" },
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
    "Review Block Requests": {
      perm: "approveGameBlocks",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        if (!argValues.userId) {
          siteInfo.showAlert("Pick a user.", "warning");
          return;
        }
        if (typeof setResults === "function") {
          setResults(
            createElement(BlockRequests, {
              key: `${argValues.userId}-${Date.now()}`,
              userId: argValues.userId,
            })
          );
        }
        commandRan();
      },
    },
    // Logged when a request is approved from Review Block Requests.
    "Approve Game Block": {
      perm: "approveGameBlocks",
      category: "User Management",
      hidden: true,
      args: [
        {
          label: "User",
          name: "blockerId",
          type: "user_search",
        },
        {
          label: "User",
          name: "blockedId",
          type: "user_search",
        },
      ],
    },
    "Restore Deleted User": {
      perm: "restoreDeletedUser",
      category: "User Management",
      args: [
        {
          label: "Email",
          name: "email",
          type: "text",
        },
      ],
      run: function () {
        const email = (argValues.email || "").trim();

        if (!email) {
          siteInfo.showAlert("Email is required.", "warning");
          return;
        }

        axios
          .post("/api/mod/restoreDeletedUser", { email })
          .then((res) => {
            const {
              message,
              userId,
              fbUid,
              temporaryPassword,
              passwordResetLink,
            } = res.data || {};

            const details = [
              message || "User restored.",
              userId ? `User ID: ${userId}` : null,
              fbUid ? `Firebase UID: ${fbUid}` : null,
              temporaryPassword
                ? `Temporary Password: ${temporaryPassword}`
                : null,
              passwordResetLink
                ? `Password Reset Link: ${passwordResetLink}`
                : null,
            ]
              .filter(Boolean)
              .join(" | ");

            if (typeof setResults === "function") {
              setResults(details);
            }

            siteInfo.showAlert("Restore command executed.", "success");
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
    "Award Trophy": {
      perm: "awardTrophy",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Trophy Name",
          name: "name",
          type: "text",
        },
        {
          label: "Trophy Type",
          name: "type",
          type: "select",
          options: [
            { value: "gold", label: "Gold" },
            { value: "silver", label: "Silver" },
            { value: "bronze", label: "Bronze" },
          ],
          default: "silver",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/awardTrophy", argValues)
          .then(() => {
            siteInfo.showAlert("Trophy awarded.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Award Stamp": {
      perm: "awardStamp",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Game Type",
          name: "gameType",
          type: "text",
          default: "Mafia",
        },
        {
          label: "Role",
          name: "role",
          type: "role_autocomplete",
          gameTypeArg: "gameType",
        },
        {
          label: "Quantity",
          name: "quantity",
          type: "text",
          default: "1",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/awardStamp", argValues)
          .then(() => {
            siteInfo.showAlert("Stamp(s) awarded.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Revoke Trophy": {
      perm: "awardTrophy",
      category: "User Management",
      args: [
        {
          label: "Trophy ID",
          name: "trophyId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/revokeTrophy", argValues)
          .then(() => {
            siteInfo.showAlert("Trophy revoked.", "success");
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
    "Clear All Login Link Evidence": {
      perm: "clearAllIPs",
      category: "Site Management",
      args: [],
      run: function () {
        axios
          .post("/api/mod/clearAllIPs", argValues)
          .then(() => {
            siteInfo.showAlert("IP and device-link evidence cleared.", "success");
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
    "Unlink Accounts": {
      perm: "viewAlts",
      category: "User Management",
      args: [
        {
          label: "User A",
          name: "userId1",
          type: "user_search",
        },
        {
          label: "User B",
          name: "userId2",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/unlinkAccounts", argValues)
          .then((res) => {
            const removed = res.data && res.data.removed;
            const n = Array.isArray(removed) ? removed.length : 0;
            const fingerprints = Number(res.data && res.data.removedFingerprintCount) || 0;
            if (n === 0) {
              siteInfo.showAlert(
                (res.data && res.data.message) ||
                  (fingerprints > 0
                    ? `Removed ${fingerprints} shared device-link record(s) from both users.`
                    : "No shared login evidence removed."),
                "success"
              );
            } else {
              siteInfo.showAlert(
                `Removed ${n} shared IP address(es) and ${fingerprints} shared device-link record(s) from both users.`,
                "success"
              );
            }
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
    "Fix Access": {
      perms: ["approveRanked", "approveCompetitive"],
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
          .post("/api/mod/fixAccess", argValues)
          .then((res) => {
            siteInfo.showAlert(
              res.data && typeof res.data === "string" ? res.data : "Access restored.",
              "success"
            );
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
    "Award Hearts": {
      perm: "changeUsersName",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Heart Type",
          name: "heartType",
          type: "select",
          options: [
            { value: "red", label: "Red" },
            { value: "gold", label: "Gold" },
          ],
        },
        {
          label: "Quantity",
          name: "quantity",
          type: "number",
          default: 1,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/awardHearts", argValues)
          .then(() => {
            siteInfo.showAlert("Hearts awarded.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Revoke Hearts": {
      perm: "changeUsersName",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Heart Type",
          name: "heartType",
          type: "select",
          options: [
            { value: "red", label: "Red" },
            { value: "gold", label: "Gold" },
          ],
        },
        {
          label: "Quantity",
          name: "quantity",
          type: "number",
          default: 1,
        },
      ],
      run: function () {
        axios
          .post("/api/mod/revokeHearts", argValues)
          .then(() => {
            siteInfo.showAlert("Hearts revoked.", "success");
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
    "Create Competitive Season": {
      perm: "manageCompetitive",
      category: "Competitive Management",
      args: [
        {
          label: "Start Date (YYYY-MM-DD)",
          name: "startDate",
          type: "text",
        },
        {
          label: "Number of rounds",
          name: "numRounds",
          type: "number",
          optional: true,
        },
        {
          label: "Number of setups per round",
          name: "setupsPerRound",
          type: "number",
          optional: true,
        },
      ],
      run: function () {
        axios
          .post("/api/competitive/create", argValues)
          .then(() => {
            siteInfo.showAlert("Competitive season created.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Toggle Competitive Season Pause": {
      perm: "manageCompetitive",
      category: "Competitive Management",
      args: [],
      run: function () {
        axios
          .post("/api/competitive/pause", argValues)
          .then((res) => {
            siteInfo.showAlert(
              `Competitive season ${
                Boolean(res.data) ? "paused" : "unpaused"
              }.`,
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Disqualify User": {
      perm: "manageCompetitive",
      category: "Competitive Management",
      args: [
        {
          label: "Season",
          name: "season",
          type: "number",
        },
        {
          label: "Round",
          name: "round",
          type: "number",
        },
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
      ],
      run: function () {
        axios
          .post("/api/competitive/disqualify", {
            season: Number(argValues.season),
            round: Number(argValues.round),
            userId: argValues.userId,
          })
          .then((res) => {
            siteInfo.showAlert(
              res.data?.message || "User disqualified from round.",
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "End Round Early": {
      perm: "manageCompetitive",
      category: "Competitive Management",
      args: [
        {
          label: "Season",
          name: "season",
          type: "number",
        },
        {
          label: "Round",
          name: "round",
          type: "number",
        },
      ],
      run: function () {
        axios
          .post("/api/competitive/endRoundEarly", {
            season: Number(argValues.season),
            round: Number(argValues.round),
          })
          .then((res) => {
            siteInfo.showAlert(
              res.data?.message || "Round moved to first review day.",
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Manage Credits": {
      perm: "changeUsersName",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Contributor Type",
          name: "contributorType",
          type: "select",
          options: [
            { value: "code", label: "Code" },
            { value: "art", label: "Art" },
            { value: "music", label: "Music" },
            { value: "design", label: "Design" },
          ],
        },
      ],
      run: function () {
        axios
          .post("/api/mod/assignCredit", {
            userId: argValues.userId,
            contributorType: argValues.contributorType,
          })
          .then(() => {
            siteInfo.showAlert("Contributor credit updated.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Review GitHub Link": {
      perm: "approveGithubLinks",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "GitHub Username",
          name: "username",
          type: "text",
          optional: true,
        },
        {
          label: "Decision",
          name: "decision",
          type: "select",
          options: [
            { value: "approved", label: "Approve" },
            { value: "rejected", label: "Reject" },
          ],
        },
      ],
      run: function () {
        axios
          .post("/api/mod/githubLinks", {
            userId: argValues.userId,
            decision: argValues.decision,
          })
          .then(() => {
            siteInfo.showAlert("GitHub link reviewed.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Manage Role Icon Credit": {
      perm: "changeUsersName",
      category: "User Management",
      args: [
        {
          label: "User",
          name: "userId",
          type: "user_search",
        },
        {
          label: "Role name",
          name: "roleName",
          type: "role_autocomplete",
          defaultGameType: "Mafia",
        },
        {
          label: "Style (skin)",
          name: "style",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/roleIconCredit", {
            userId: argValues.userId,
            roleName: argValues.roleName,
            style: argValues.style,
          })
          .then((res) => {
            siteInfo.showAlert(
              res.data?.assigned
                ? "Role icon credit assigned."
                : "Role icon credit revoked.",
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Clear Family Content": {
      perm: "clearFamilyContent",
      category: "Family Management",
      args: [
        {
          label: "Family Id",
          name: "familyId",
          type: "text",
        },
      ],
      run: function () {
        axios
          .post("/api/mod/clearFamilyContent", argValues)
          .then(() => {
            siteInfo.showAlert("Family content cleared.", "success");
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
            siteInfo.showAlert(
              typeof res.data === "string" ? res.data : "Game refunded.",
              "success"
            );
            commandRan();
          })
          .catch(errorAlert);
      },
    },
    "Purge Game": {
      perm: "purgeGame",
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
          .post("/api/mod/purgeGame", argValues)
          .then(() => {
            siteInfo.showAlert("Game purged from database.", "success");
            commandRan();
          })
          .catch(errorAlert);
      },
    },
  };

  const banActionNames = [
    "Forum Ban",
    "Chat Ban",
    "Game Ban",
    "Ranked Ban",
    "Competitive Ban",
    "Site Ban",
  ];
  // Older log entries have no scope; those bans included linked accounts.
  const banActionArgs = [
    { label: "User", name: "userId", type: "user_search" },
    { label: "Length", name: "length", type: "text" },
    { label: "Scope", name: "scope", type: "text" },
  ];
  banActionNames.forEach((actionName) => {
    commands[actionName] = {
      perm: "ban",
      category: "User Management",
      hidden: true,
      args: banActionArgs.map((arg) => ({ ...arg })),
      run: () => {},
    };
  });

  // Mod-action log entries written by /mod/banAppeal/rule.
  ["Accept Ban Appeal", "Deny Ban Appeal", "Vote On Ban Appeal"].forEach(
    (actionName) => {
      commands[actionName] = {
        perm: "unban",
        category: "User Management",
        hidden: true,
        args: [
          { label: "User", name: "userId", type: "user_search" },
          { label: "Appeal Id", name: "appealId", type: "text" },
          { label: "Vote", name: "vote", type: "text", optional: true },
        ],
        run: () => {},
      };
    }
  );

  const unbanActionNames = [
    "Forum Unban",
    "Chat Unban",
    "Game Unban",
    "Ranked Unban",
    "Competitive Unban",
    "Site Unban",
  ];
  const unbanActionArgs = [
    { label: "User", name: "userId", type: "user_search" },
    { label: "Scope", name: "scope", type: "text" },
  ];
  unbanActionNames.forEach((actionName) => {
    commands[actionName] = {
      perm: "unban",
      category: "User Management",
      hidden: true,
      args: unbanActionArgs.map((arg) => ({ ...arg })),
      run: () => {},
    };
  });

  return commands;
}
