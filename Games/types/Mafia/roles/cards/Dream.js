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
        labels: ["dream", "hidden"],
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          var aliveExceptSelf = this.game.players.filter(
            (p) => p.alive && p != this.actor
          );
          if (aliveExceptSelf.length < 3) return;

          if (this.hasVisitors()) return;

          var dream;
          const evilPlayers = aliveExceptSelf.filter(
            (p) =>
              p.role.alignment == "Mafia" ||
              p.role.alignment == "Cult" ||
              p.role.alignment == "Hostile"
          );
          const village = aliveExceptSelf.filter(
            (p) => p.role.alignment == "Village"
          );

          if (village.length == 0) {
            dream = `:sy2f: You had a dream that you can trust no one but yourself...`;
          } else if (evilPlayers.length == 0 || Random.randInt(0, 1) == 0) {
            const chosenOne = Random.randArrayVal(village);
            dream = `:sy2f: You had a dream that you can trust ${chosenOne.name}...`;
          } else {
            // guarantee no repeats in dream
            var chosenThree = [Random.randArrayVal(evilPlayers)];
            aliveExceptSelf = aliveExceptSelf.filter(
              (p) => p !== chosenThree[0]
            );
            aliveExceptSelf = Random.randomizeArray(aliveExceptSelf);
            chosenThree.push(aliveExceptSelf[0]);
            chosenThree.push(aliveExceptSelf[1]);
            chosenThree = Random.randomizeArray(chosenThree);
            dream = `:sy2f: You had a dream where at least one of ${chosenThree[0].name}, ${chosenThree[1].name}, and ${chosenThree[2].name} is evil...`;
          }

          this.actor.queueAlert(dream);
        },
      },
    ];
  }
};
