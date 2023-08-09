const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Dream extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["dream"],
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          if (this.game.players.length < 3) return;

          var alive = this.game.players.filter(
            (p) => p.alive && p != this.actor
          );

          if (alive.length < 3) return;

          if (this.hasVisitors()) return;

          var dream;
          var mafia = alive.filter((p) => p.role.alignment == "Mafia");
          var village = alive.filter((p) => p.role.alignment == "Village");
          var chosenThree = [
            Random.randArrayVal(alive, true),
            Random.randArrayVal(alive, true),
            Random.randArrayVal(alive, true),
          ];
          var messageProb = Random.randInt(0, 1);

          if (village.length == 0)
            dream = `:sy2f: You had a dream that you can trust no one but yourself...`;
          else if (mafia.length == 0 || messageProb == 0) {
            var chosenOne = Random.randArrayVal(village);
            dream = `:sy2f: You had a dream that you can trust ${chosenOne.name}...`;
          } else {
            if (
              chosenThree.filter((p) => p.role.alignment == "Mafia").length == 0
            ) {
              chosenThree[0] = Random.randArrayVal(mafia);
              chosenThree = Random.randomizeArray(chosenThree);
            }

            dream = `:sy2f: You had a dream where at least one of ${chosenThree[0].name}, ${chosenThree[1].name}, and ${chosenThree[2].name} is the Mafia...`;
          }

          this.actor.queueAlert(dream);
        },
      },
    ];
  }
};
