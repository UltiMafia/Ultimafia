const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const { PRIORITY_COPY_ACTIONS } = require("../../const/Priority");

module.exports = class GlobalModifier extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Dawn/)) {
          return;
        }
        let actions = [];
        for (let action of this.game.actions[0]) {
          if (
            action.actor == this.player &&
            action.target instanceof Player &&
            action.target != this.player &&
            !action.hasLabels(["kill", "mafia"])
          ) {
            actions.push(action);
          }
        }

        for (let visit of actions) {
          for (let person of this.game.alivePlayers()) {
            if (person != visit.target) {
              var actionCopy = new Action({
                actor: visit.actor,
                target: person,
                game: visit.game,
                meeting: visit.meeting,
                priority: visit.priority,
                labels: visit.labels,
                run: visit.unboundRun,
                power: visit.power,
                item: visit.item,
                effect: visit.effect,
                delay: visit.delay,
              });
              this.game.queueAction(actionCopy);
            }
          }
        }
      },
      extraStateCheck: function (stateName) {
        if (this.game.ExtraStates == null) {
          this.game.ExtraStates = [];
        }
        if (stateName == "Dawn" && !this.game.ExtraStates.includes("Dawn")) {
          this.game.ExtraStates.push("Dawn");
        }
      },
    };
  }
};
