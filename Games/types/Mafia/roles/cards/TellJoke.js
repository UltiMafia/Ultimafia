const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
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
          run: function () {
            let alive = this.game.alivePlayers();

            let chosen = [
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
            ];

            let tellJokeAbout = Random.randArrayVal(chosen).name;
            let shuffledChosen = Random.randomizeArray(chosen).map(
              (p) => p.getRoleAppearance()
            );
            let roles = `A ${shuffledChosen[0]}, a ${shuffledChosen[1]} and a ${shuffledChosen[2]}`;

            this.target.queueAlert(
              `${roles} walk up to a bar, and one of them is ${tellJokeAbout}.`
            );
          },
        },
      },
    };
  }
};
