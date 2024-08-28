const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnAndLifeLinkToPlayer extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (this.actor.role.hasInfo) return;
          if (!this.actor.alive) return;

          if (this.actor.role.targetPlayer) {
            let learnPlayer = this.actor.role.targetPlayer;
            let learnRole = learnPlayer.getRoleAppearance();

            if (this.actor.hasEffect("FalseMode")) {
              var alive = this.game.players.filter(
                (p) => p.alive && p != this.actor && p != learnPlayer
              );
              alive = Random.randomizeArray(alive);
              learnPlayer = alive[0];
              if (
                alive.filter(
                  (p) =>
                    p.getRoleAppearance() != learnPlayer.getRoleAppearance() &&
                    p.role.alignment == this.actor.role.alignment
                ).length > 0
              ) {
                alive = alive.filter(
                  (p) =>
                    p.getRoleAppearance() != learnPlayer.getRoleAppearance() &&
                    p.role.alignment == this.actor.role.alignment
                );
              }
              alive = Random.randomizeArray(alive);
              learnRole = alive[0].getRoleAppearance();
            }

            this.actor.queueAlert(
              `You are Married to ${learnPlayer.name} who is a ${learnRole}. If they die during the night to another alignment, You will die as well.`
            );
          }

          this.actor.role.hasInfo = true;
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        const nonMafia = this.game.players.filter(
          (p) =>
            p.role.alignment === this.player.role.alignment &&
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
        if (player === this.player.role.targetPlayer && this.player.alive) {
          this.player.kill("basic", this.player);
        }
      },
    };
  }
};
