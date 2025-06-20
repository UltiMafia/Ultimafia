const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class GuessRoleOrGetBlocked extends Card {
  constructor(role) {
    super(role);

      this.meetings = {
      "Guess Role": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        inputType: "AllRoles",
        AllRolesFilters: ["addedRoles"],
        //targets: { targetOptions },
        shouldMeet: function () {
          return !this.hasBlocked;
        },
        action: {
          labels: ["block", "role"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
          run: function () {
            if (this.target == "None") return;
        if (!this.actor.hasAbility(["Blocking", "Modifier"])) {
          return;
        }
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("absolute")) {
                continue;
              }
              if (action.hasLabel("mafia")) {
                continue;
              }
              if (action.hasLabel("hidden")) {
                continue;
              }

              let toCheck = action.target;
              if (!Array.isArray(action.target)) {
                toCheck = [action.target];
              }

              if (
                action.actors.indexOf(this.actor) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck[0] instanceof Player
              ) {
                for (let y = 0; y < toCheck.length; y++) {
                  if (`${toCheck[y].role.name}:${toCheck[y].role.modifier}` != this.target) {
                    if (
                      action.priority > this.priority &&
                      !action.hasLabel("absolute")
                    ) {
                      action.cancelActor(this.actor);
                      break;
                    }
                  }
                }
              }
            }
            
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Blocking", "Modifier"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("absolute")) {
                continue;
              }
              if (action.hasLabel("mafia")) {
                continue;
              }
              if (action.hasLabel("hidden")) {
                continue;
              }

              let toCheck = action.target;
              if (!Array.isArray(action.target)) {
                toCheck = [action.target];
              }

              if (
                action.actors.indexOf(this.actor) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck[0] instanceof Player
              ) {
                for (let y = 0; y < toCheck.length; y++) {
                  if (toCheck[y].role.alignment == this.actor.role.alignment) {
                    if (
                      action.priority > this.priority &&
                      !action.hasLabel("absolute")
                    ) {
                      action.cancelActor(this.actor);
                      break;
                    }
                  }
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
