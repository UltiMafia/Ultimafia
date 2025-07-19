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
          (p) => p.role.alignment === "Village" && p.alive && p !== this.player
        );
        let shuffledPlayers = Random.randomizeArray(nonMafia);
        if (nonMafia.length <= 0) return;
        this.targetPlayer = Random.randArrayVal(nonMafia);
      },
      death: function (player, killer, deathType, instant) {
        if(this.targetPlayer && player != this.targetPlayer){
          return;
        }
        if (this.game.getStateName() != "Night") return;
        if (killer.role.alignment != "Mafia" && !killer.isDemonic(true)) return;
        if (!this.player.hasAbility(["Kill", "OnlyWhenAlive"])) {
          return;
        }
        if (this.player.alive) {
          var action = new Action({
            actor: this.player,
            target: this.player,
            game: this.holder.game,
            labels: ["kill"],
            run: function () {
              if (this.dominates())
                this.target.kill("basic", this.actor, instant);
            },
          });

          action.do();
        }
      },
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          role: this,
          labels: ["investigate", "role"],
          run: function () {
            if (this.role.hasInfo) return;

            if (this.actor.role.targetPlayer) {
              let learnPlayer = this.role.targetPlayer;
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
                `You are Married to ${learnPlayer.name} who is a ${learnRole}. If they are killed by the Mafia or a Demonic role you will die.`
              );
            }

            this.role.hasInfo = true;
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
