const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TellJoke extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Tell Joke": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run() {
            const alive = this.game.alivePlayers();

            const chosen = [
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
            ];

            const tellJokeAbout = Random.randArrayVal(chosen).name;
            const shuffledChosen = Random.randomizeArray(chosen).map(
              (p) => p.role.name
            );
            const roles = `A ${shuffledChosen[0]}, a ${shuffledChosen[1]} and a ${shuffledChosen[2]}`;

            this.target.queueAlert(
              `${roles} walk up to a bar, and one of them is ${tellJokeAbout}.`
            );
          },
        },
      },
    };
  }
};
