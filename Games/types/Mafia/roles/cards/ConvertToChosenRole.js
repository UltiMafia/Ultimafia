const Card = require("../../Card");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_MIGO_DEMON_PRECHECK,
} = require("../../const/Priority");

// Same checks as "Convert To": role not already in play, Independent
// alignment must match, and dominates(). emitImmune is false for the
// pre-check so a later successful convert still emits the immune event.
function conversionWouldSucceed(action, targetPlayer, roleName, emitImmune) {
  if (!targetPlayer || !roleName || !targetPlayer.role) return false;

  let players = action.game.players.filter((p) => p.role);
  for (let y = 0; y < players.length; y++) {
    if (
      roleName.split(":")[0] ==
      action.game.formatRoleInternal(
        players[y].role.name,
        players[y].role.modifier
      )
    ) {
      return false;
    }
  }

  let chosenAlignment = action.game.getRoleAlignment(roleName);
  let currentAlignment = targetPlayer.role.alignment;
  let bothNormal =
    chosenAlignment != "Independent" && currentAlignment != "Independent";
  let bothIndependent =
    chosenAlignment == "Independent" && currentAlignment == "Independent";
  if (!bothNormal && !bothIndependent) return false;

  return action.dominates(targetPlayer, emitImmune !== false);
}

function queuedMeetingTarget(action, meetingName) {
  for (let queued of action.game.actions[0]) {
    if (queued.actor !== action.actor) continue;
    if (!queued.meeting || queued.meeting.name !== meetingName) continue;
    return queued.target;
  }
  return null;
}

module.exports = class ConvertToChosenRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          role: this.role,
          priority: PRIORITY_CONVERT_DEFAULT + 3,
          run: function () {
            this.role.data.targetPlayer = this.target;
          },
        },
      },
      "Convert To": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "AllRoles",
        action: {
          role: this.role,
          labels: ["convert", "role"],
          priority: PRIORITY_CONVERT_DEFAULT + 4,
          run: function () {
            this.role.data.chosenRole = this.target;
            let targetPlayer = this.role.data.targetPlayer;
            if (targetPlayer) {
              if (
                conversionWouldSucceed(this, targetPlayer, this.target, true)
              ) {
                let chosenAlignment = this.game.getRoleAlignment(this.target);
                if (chosenAlignment != "Independent") {
                  targetPlayer.setRole(
                    `${this.target}`,
                    null,
                    false,
                    false,
                    false,
                    "No Change"
                  );
                } else {
                  targetPlayer.setRole(`${this.target}`);
                }
              }
              delete this.role.data.targetPlayer;
              delete this.role.data.chosenRole;
            }
          },
        },
      },
    };

    // Night-only. Roleblock cancels this (priority -149 > -197) before it
    // runs. Kills are still queued, so this night's kill can be dropped.
    this.passiveActions = [
      {
        state: "Night",
        actor: role.player,
        game: role.player.game,
        role: role,
        labels: ["convert", "role"],
        priority: PRIORITY_MIGO_DEMON_PRECHECK,
        run: function () {
          if (!this.actor || !this.actor.alive) return;

          let targetPlayer =
            this.role.data.targetPlayer ||
            queuedMeetingTarget(this, "Select Player");
          let chosenRole =
            this.role.data.chosenRole ||
            queuedMeetingTarget(this, "Convert To");

          if (!targetPlayer || !targetPlayer.isDemonic) return;
          if (typeof chosenRole != "string") return;
          if (chosenRole == "None" || chosenRole == "*") return;
          if (!targetPlayer.isDemonic(true)) return;
          if (!this.game.getRoleTags(chosenRole).includes("Demonic")) return;
          if (
            !conversionWouldSucceed(this, targetPlayer, chosenRole, false)
          ) {
            return;
          }

          for (let queued of this.game.actions[0]) {
            if (queued.actor === targetPlayer && queued.hasLabel("kill")) {
              queued.cancel(true);
            }
          }
        },
      },
    ];
  }
};
