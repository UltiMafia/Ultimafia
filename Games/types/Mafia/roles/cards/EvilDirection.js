const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class EvilDirection extends Card {
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

          if (evilPlayers.length <= 0) {
            this.actor.queueAlert(
              `There wasn't enough evil players for your abilty to work!`
            );
            return;
          }

          var evilTarget = Random.randArrayVal(evilPlayers);
          var indexOfTarget = alive.indexOf(this.actor);
          var rightIdx;
          var leftIdx;
          var leftAlign;
          var rightAlign;
          var distance = 0;
          var found = false;
          let info = "";

          for (let x = 0; x < alive.length; x++) {
            leftIdx =
              (indexOfTarget - distance - 1 + alive.length) % alive.length;
            rightIdx = (indexOfTarget + distance + 1) % alive.length;
            leftAlign = this.game.getRoleAlignment(
              alive[leftIdx].getRoleAppearance().split(" (")[0]
            );
            rightAlign = this.game.getRoleAlignment(
              alive[rightIdx].getRoleAppearance().split(" (")[0]
            );

            if (rightAlign == "Cult" || rightAlign == "Mafia") {
              found = true;
              info = "Below";
              break;
            } else if (leftAlign == "Cult" || leftAlign == "Mafia") {
              found = true;
              info = "Above";
              break;
            } else {
              distance = x;
            }
          }

          if (this.actor.hasEffect("FalseMode")) {
            if (distance == "Above") {
              distance = "Below";
            } else {
              distance = "Above";
            }
          }

          this.actor.queueAlert(
            `You learn that the closest Evil player to you is ${info} you on the player list!`
          );

          this.actor.role.hasInfo = true;
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Information", "OnlyWhenAlive"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          labels: ["investigate"],
          role: this,
          run: function () {
            if (this.role.hasInfo) return;
            if (!this.actor.alive) return;
            let info = this.game.createInformation(
              "DirectionToEvilInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo();
            if (info.mainInfo == "Not Applicable") {
              this.role.hasInfo = false;
              this.actor.queueAlert(
                `There wasn't enough evil players for your abilty to work!`
              );
              return;
            }
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

            if (evilPlayers.length <= 0) {
              this.actor.queueAlert(
                `There wasn't enough evil players for your abilty to work!`
              );
              return;
            }

            var evilTarget = Random.randArrayVal(evilPlayers);
            var indexOfTarget = alive.indexOf(this.actor);
            var rightIdx;
            var leftIdx;
            var leftAlign;
            var rightAlign;
            var distance = 0;
            var found = false;
            let info = "";

            for (let x = 0; x < alive.length; x++) {
              leftIdx =
                (indexOfTarget - distance - 1 + alive.length) % alive.length;
              rightIdx = (indexOfTarget + distance + 1) % alive.length;
              leftAlign = this.game.getRoleAlignment(
                alive[leftIdx].getRoleAppearance().split(" (")[0]
              );
              rightAlign = this.game.getRoleAlignment(
                alive[rightIdx].getRoleAppearance().split(" (")[0]
              );

              if (rightAlign == "Cult" || rightAlign == "Mafia") {
                found = true;
                info = "Below";
                break;
              } else if (leftAlign == "Cult" || leftAlign == "Mafia") {
                found = true;
                info = "Above";
                break;
              } else {
                distance = x;
              }
            }

            if (this.actor.hasEffect("FalseMode")) {
              if (distance == "Above") {
                distance = "Below";
              } else {
                distance = "Above";
              }
            }

            this.actor.queueAlert(
              `You learn that the closest Evil player to you is ${info} you on the player list!`
            );
*/
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
