const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class LearnEvilDeadCount extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 2,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
          let evilCount;
          let players = this.game.deadPlayers();

          if (players.length <= 0) {
            return;
          }

          var evilPlayers = players.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Cult" ||
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Mafia"
          );
          evilCount = evilPlayers.length;

          if (this.actor.hasEffect("FalseMode")) {
            if (evilCount == 0) evilCount = 1;
            else evilCount = evilCount - 1;
          }

          this.actor.queueAlert(
            `You learn that ${evilCount} dead players are Evil.`
          );
        },
      },
    ];
*/

    this.listeners = {
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
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
          labels: ["investigate"],
          run: function () {
            if (!this.actor.alive) return;
            let evilCount;
            let players = this.game.deadPlayers();

            if (players.length <= 0) {
              return;
            }

            let info = this.game.createInformation(
              "EvilDeadCountInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            this.actor.role.hasInfo = true;
            var alert = `:invest: ${info.getInfoFormated()}`;
            this.actor.queueAlert(alert);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
