const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class Nonconsecutive extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            if (!this.actor.hasAbility(["Modifier", "WhenDead", "Blocking"])) {
              return;
            }
            let visits = [];
            let actionList = this.game.lastNightVisits;
            for (let action of actionList) {
              let toCheck1 = action.target;
              if (!Array.isArray(action.target)) {
                toCheck1 = [action.target];
              }

              if (
                action.actors.indexOf(this.actor) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck1[0] instanceof Player
              ) {
                visits.push(...toCheck1);
              }
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
                  if (visits.includes(toCheck[y])) {
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
