const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class NightSaveAndLifeLink extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Save: {
        actionName: "Sing To",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          role: this.role,
          run: function () {
            this.heal(1);
            this.role.data.playerToKill = this.target;
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.data.playerToKill = null;
        }
      },
      death: function (player, killer, deathType, instant) {
        if (player == this.player && this.data.playerToKill) {
          if (!this.hasAbility(["Kill", "WhenDead"])) {
            return;
          }

          var action = new Action({
            actor: this.player,
            target: this.data.playerToKill,
            game: this.game,
            labels: ["kill"],
            power: 2,
            run: function () {
              if (this.dominates())
                this.target.kill("basic", this.actor, instant);
            },
          });

          action.do();

          //this.data.playerToReveal.role.revealToAll();
        }
      },
    };
  }
};
