const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Dream extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        labels: ["dream", "hidden", "investigate"],
        role: role,
        run: function () {
            var aliveExceptSelf = this.game.players.filter(
              (p) => p.alive && p != this.actor
            );
            if (aliveExceptSelf.length < 3) return;

            if (this.hasVisitors()) return;

            let infoEvil = this.game.createInformation(
              "ThreePlayersOneEvilInfo",
              this.actor,
              this.game,
              this.actor
            );
            let infoGood = this.game.createInformation(
              "GoodPlayerInfo",
              this.actor,
              this.game,
              this.actor
            );
            infoEvil.processInfo();
            infoGood.processInfo();
            var alert;
            if (infoGood.mainInfo == "No Good Players Exist") {
              infoGood.getInfoRaw();
              alert = `:dream: You had a dream that you can trust no one but yourself…`;
            } else if (
              infoEvil.mainInfo == "No Evil Players Exist" ||
              Random.randInt(0, 1) == 0
            ) {
              alert = `:dream: You had a dream that you can trust ${
                infoGood.getInfoRaw().name
              }…`;
            } else {
              let evilNames = infoEvil.getInfoRaw();
              alert = `:dream: You had a dream where at least one of ${evilNames[0].name}, ${evilNames[1].name}, and ${evilNames[2].name} is evil…`;
            }

            this.actor.queueAlert(alert);
          },
      },
    ];

  }
};
