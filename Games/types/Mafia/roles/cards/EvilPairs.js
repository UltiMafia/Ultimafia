const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class EvilPairs extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (this.actor.role.hasInfo) return;
          if (!this.actor.alive) return;

          let alive = this.game.alivePlayers();
          var evilPlayers = alive.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Cult" ||
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Mafia"
          );

          var evilPair = 0;
          var index;
          var rightIdx;
          var neighborAlignment;
          for (let x = 0; x < evilPlayers.length; x++) {
            index = alive.indexOf(evilPlayers[x]);
            rightIdx = (index + 1) % alive.length;
            neighborAlignment = this.game.getRoleAlignment(
              alive[rightIdx].getRoleAppearance().split(" (")[0]
            );

            if (neighborAlignment == "Cult" || neighborAlignment == "Mafia") {
              evilPair = evilPair + 1;
            }
          }

          if (this.actor.hasEffect("FalseMode")) {
            if (evilPair == 0) {
              evilPair = 1;
            } else {
              evilPair = evilPair - 1;
            }
          }

          this.actor.queueAlert(
            `After Evaluating the neighborhood you learn that there is ${evilPair} pairs of evil players!`
          );
          this.actor.role.hasInfo = true;
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information", "OnlyWhenAlive"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          role: this,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          labels: ["investigate"],
          run: function () {
            if (this.role.hasInfo) return;
            if (!this.actor.alive) return;
            let info = this.game.createInformation(
              "EvilPairsInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            this.role.hasInfo = true;
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);
            /*
            let alive = this.game.alivePlayers();
            var evilPlayers = alive.filter(
              (p) =>
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Cult" ||
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Mafia"
            );

            var evilPair = 0;
            var index;
            var rightIdx;
            var neighborAlignment;
            for (let x = 0; x < evilPlayers.length; x++) {
              index = alive.indexOf(evilPlayers[x]);
              rightIdx = (index + 1) % alive.length;
              neighborAlignment = this.game.getRoleAlignment(
                alive[rightIdx].getRoleAppearance().split(" (")[0]
              );

              if (neighborAlignment == "Cult" || neighborAlignment == "Mafia") {
                evilPair = evilPair + 1;
              }
            }

            if (this.actor.hasEffect("FalseMode")) {
              if (evilPair == 0) {
                evilPair = 1;
              } else {
                evilPair = evilPair - 1;
              }
            }

            this.actor.queueAlert(
              `After Evaluating the neighborhood you learn that there is ${evilPair} pairs of evil players!`
            );
            */
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
