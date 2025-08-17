const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../../const/Priority");

module.exports = class Wannabe extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (
          !this.hasAbility(["Modifier", "Deception"]) &&
          !(
            this.player.role.name == "Wannabe" && this.hasAbility(["Deception"])
          )
        ) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        //const target_list = this.game.players.filter((p) => p.alive);
        const target_list = this.game.players.filter(
          (p) => p.alive && p != this.player
        );
        const target = Random.randArrayVal(target_list);

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
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
        });

        this.game.queueAction(action);
      },
    };
  }
};
