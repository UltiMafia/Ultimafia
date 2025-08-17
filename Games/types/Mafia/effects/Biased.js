const Effect = require("../Effect");
const Action = require("../Action");
const Player = require("../Player");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class Biased extends Effect {
  constructor(lifespan, effecter, types) {
    super("Biased");
    this.effecter = effecter;
    this.lifespan = lifespan;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: null,
          target: this.effecter,
          game: this.player.game,
          effect: this,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 1,
          labels: ["block", "hidden"],
          run: function () {
            for (let action of this.game.actions[0]) {
              let toCheck = action.target;
              if (!Array.isArray(action.target)) {
                toCheck = [action.target];
              }

              if (
                action.actors.indexOf(this.effect.effecter) != -1 &&
                action.hasLabel("investigate") &&
                action.target &&
                toCheck[0] instanceof Player
              ) {
                if (toCheck.includes(this.effect.player)) {
                  this.effect.effecter.giveEffect("UnfavorableMode", -1);
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
