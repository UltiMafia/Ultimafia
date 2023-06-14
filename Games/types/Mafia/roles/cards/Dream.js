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
        run() {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          if (this.game.players.length < 3) return;

          for (const action of this.game.actions[0])
            if (action.target == this.actor && !action.hasLabel("hidden"))
              return;

          const alive = this.game.players.filter(
            (p) => p.alive && p != this.actor
          );

          if (alive.length < 3) return;

          let dream;
          const mafia = alive.filter((p) => p.role.alignment == "Mafia");
          const village = alive.filter((p) => p.role.alignment == "Village");
          let chosenThree = [
            Random.randArrayVal(alive, true),
            Random.randArrayVal(alive, true),
            Random.randArrayVal(alive, true),
          ];
          const messageProb = Random.randInt(0, 1);

          if (village.length == 0)
            dream = `:sy2f: You had a dream that you can trust no one but yourself...`;
          else if (mafia.length == 0 || messageProb == 0) {
            const chosenOne = Random.randArrayVal(village);
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
