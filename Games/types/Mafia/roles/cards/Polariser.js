const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_EFFECT_GIVER_EARLY,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class Polariser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Polarize Someone": {
        states: ["Night"],
        flags: ["voting", "group", "speech"],
        targets: { include: ["alive"], exclude: ["members"] },
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          run: function () {
            this.target.giveEffect("Polarised");
          },
        },
      },
      "Polarize Someone Else": {
        states: ["Night"],
        flags: ["voting", "group"],
        targets: { include: ["alive"], exclude: ["members"] },
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          run: function () {
            this.target.giveEffect("Polarised");
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Kill", "Effect"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden", "absolute"],
          run: function () {
            for (let player of this.game.players) {
              let visitors = this.getVisitors(player);
              if (player.hasEffect("Polarised")) {
                for (let v of visitors) {
                  if (!v.hasEffect("Polarised")) {
                    continue;
                  }

                  if (this.dominates(player)) {
                    player.kill("polarised", this.actor);
                  }

                  if (this.dominates(v)) {
                    v.kill("polarised", this.actor);
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
