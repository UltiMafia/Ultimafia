const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class HuntEvilPlayers extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
      },
      death: function (player, killer, deathType) {
        if (player === this.data.EvilTarget) {
          this.data.EvilTarget = null;
        }
      },
      state: function (stateInfo) {
        if (!this.hasAbility(["Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 20,
          labels: ["investigate"],
          role: this.role,
          run: function () {
            if (this.role.data.EvilTarget != null) return;
            let learnPlayer;
            let info = this.game.createInformation(
              "EvilPlayerInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            learnPlayer = info.getInfoRaw();

            if (learnPlayer == "No Evil Players Exist") {
              this.actor.queueAlert(`You could not Find any Evil Players.`);
            } else {
              this.role.data.EvilTarget = learnPlayer;
              this.actor.queueAlert(`You learn ${learnPlayer.name} is Evil!`);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
