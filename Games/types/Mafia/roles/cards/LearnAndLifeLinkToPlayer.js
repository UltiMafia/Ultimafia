const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAndLifeLinkToPlayer extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        const nonMafia = this.game.players.filter(
          (p) =>
            p.role.alignment === "Village" &&
            p.alive &&
            p !== this.player
        );
        let shuffledPlayers = Random.randomizeArray(nonMafia);
        if (nonMafia.length <= 0) return;
        this.player.role.targetPlayer = Random.randArrayVal(nonMafia);
      },
      death: function (player, killer, deathType) {
        if (this.game.getStateName() != "Night") return;
        if (killer.role.alignment == this.player.role.alignment) return;
        if (!this.player.hasAbility(["Kill", "OnlyWhenAlive"])) {
          return;
        }
        if (player === this.player.role.targetPlayer && this.player.alive) {
          this.player.kill("basic", this.player);
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate", "role"],
          run: function () {
            if (this.actor.role.hasInfo) return;
            if (!this.actor.alive) return;

            if (this.actor.role.targetPlayer) {
              let learnPlayer = this.actor.role.targetPlayer;
              let learnRole;

              let info = this.game.createInformation(
                "RoleInfo",
                this.actor,
                this.game,
                learnPlayer
              );
              info.processInfo();
              learnRole = info.getInfoRaw();

              this.actor.queueAlert(
                `You are Married to ${learnPlayer.name} who is a ${learnRole}. If they die during the night to another alignment, You will die as well.`
              );
            }

            this.actor.role.hasInfo = true;
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
