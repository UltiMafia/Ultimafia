const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Carol extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Sing Carol": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          labels: ["carol"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run() {
            if (this.game.players.length < 3) return;

            this.actor.role.data.prevTarget = this.target;

            for (const action of this.game.actions[0]) {
              if (
                action.actors.indexOf(this.target) != -1 &&
                action.priority < this.priority &&
                !action.hasLabel("hidden") &&
                action.target != "No"
              ) {
                return;
              }
            }

            const alive = this.game.players.filter((p) => p.alive);

            if (alive.length < 3) return;

            let carol;
            const mafia = alive.filter((p) => p.role.alignment == "Mafia");
            let chosenThree = [
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
            ];

            if (mafia.length == 0)
              carol = `:sy3c: You see a merry Caroler outside your house! They sing you a happy song about all of the Mafia being dead!`;
            else {
              if (
                chosenThree.filter((p) => p.role.alignment == "Mafia").length ==
                0
              ) {
                chosenThree[0] = Random.randArrayVal(mafia);
                chosenThree = Random.randomizeArray(chosenThree);
              }

              carol = `:sy3c: You see a merry Caroler outside your house! They sing you a Carol about ${chosenThree[0].name}, ${chosenThree[1].name}, ${chosenThree[2].name}, at least one of whom is the Mafia!`;
            }

            this.target.queueAlert(carol);
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
