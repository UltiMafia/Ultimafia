const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class HideBehindPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Hide Behind": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          role: this.role,
          run: function () {
            this.role.hideBehind = this.target;
            this.actor.tempImmunity["kill"] = Infinity;
          },
        },
      },
    };


        this.passiveActions = [
      {
        ability: ["Kill", "OnlyWhenAlive"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
              if (!this.actor.alive) return;

              let visitors = this.getVisitors();
              for (let v of visitors) {
                if (v == this.role.hideBehind) {
                  // skip the dominates check, this kill is absolute
                  this.actor.kill("eaten", v);
                  this.actor.giveEffect("ExtraLife", this.actor);
                  this.actor.queueAlert(
                    "You gained an extra life from hiding correctly."
                  );
                }
              }
            },
      },
    ];

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (stateInfo.name.match(/Day/)) {
          delete this.hideBehind;
        }
      },
    };
  }
};
