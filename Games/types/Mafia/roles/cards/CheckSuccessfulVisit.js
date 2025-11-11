const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CheckSuccessfulVisit extends Card {
  constructor(role) {
    super(role);


    this.passiveActions = [
      {
        ability: ["WhenDead", "Information"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "hidden"],
        role: role,
        run: function () {
            let targets = this.getVisits(this.actor);
            let targetNames = targets.map((t) => t.name);
            if (targetNames.length >= 1) {
              this.actor.queueAlert(
                `:invest: You learn that your visit to ${targetNames.join(
                  ", "
                )} was successful.`
              );
            }
          },
      },
    ];
    
  }
};
