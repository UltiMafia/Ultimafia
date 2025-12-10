const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class Wannabe extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "Deception"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
        labels: ["hidden"],
        run: function () {
            let possibleVictims = [];
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"]) && action.target) {
                this.actor.giveEffect("FakeVisit", 1, [action.target]);
                return;
              } else if (action.hasLabels(["kill"]) && action.target) {
                possibleVictims.push(action.target);
              }
            }
            if (possibleVictims.length > 0) {
              this.actor.giveEffect("FakeVisit", 1, [
                Random.randArrayVal(possibleVictims),
              ]);
            }
          },
      },
    ];
  }
};
