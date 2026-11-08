const Card = require("../../Card");
const Action = require("../../Action");

// Before delirium (-999), so a blocked save does not record a link.
const PRIORITY_RAKISH_LINK = -1000;

module.exports = class Rakish extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        actor: role.player,
        state: "Night",
        game: role.player.game,
        role: role,
        priority: PRIORITY_RAKISH_LINK,
        labels: ["hidden", "absolute"],
        run: function () {
          if (!this.role.hasAbility(["Modifier"])) {
            return;
          }

          for (let action of this.game.actions[0]) {
            if (
              action.actors.indexOf(this.actor) == -1 ||
              !action.hasLabel("save") ||
              action.rakishWrapped
            ) {
              continue;
            }

            action.rakishWrapped = true;
            const originalUnbound = action.unboundRun;
            const linkedRole = this.role;
            action.unboundRun = function () {
              originalUnbound.call(this);

              var linked = this.target;
              if (Array.isArray(linked)) {
                linked = linked[linked.length - 1];
              }
              if (linked && typeof linked.kill == "function") {
                linkedRole.data.playerToKill = linked;
              }
            };
            action.run = action.unboundRun.bind(action);
          }
        },
      },
    ];

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.data.playerToKill = null;
        }
      },
      death: function (player, killer, deathType, instant) {
        if (player == this.player && this.data.playerToKill) {
          if (!this.hasAbility(["Modifier", "Kill", "WhenDead"])) {
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
        }
      },
    };
  }
};
