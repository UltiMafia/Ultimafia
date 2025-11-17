const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class EvilDirection extends Card {
  constructor(role) {
    super(role);

      this.passiveActions = [
      {
        ability: ["Information", "OnlyWhenAlive"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["investigate"],
        role: role,
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
          },
      },
    ];

  }
};
