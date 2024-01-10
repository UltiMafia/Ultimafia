const { addArticle } = require("../../../../core/Utils");
const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class NightComedian extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Tell Joke": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          labels: ["joke"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run: function () {
            this.actor.role.data.prevTarget = this.target;

            let alive = this.game.alivePlayers();

            const visits = this.getVisits(this.target);
            if (visits.length > 0) return;

            let chosen = [
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
            ];

            let tellJokeAbout = Random.randArrayVal(chosen).name;
            let shuffledChosen = Random.randomizeArray(chosen).map((p) =>
              p.getRoleAppearance()
            );
            let roles = `${addArticle(shuffledChosen[0])}, ${addArticle(shuffledChosen[1])} and ${addArticleshuffledChosen[2])}`;

            this.target.queueAlert(
              `${roles} walk into a bar, and one of them is ${tellJokeAbout}.`
            );
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
