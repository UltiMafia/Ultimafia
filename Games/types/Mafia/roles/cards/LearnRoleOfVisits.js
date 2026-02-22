const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_INVESTIGATIVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class LearnRoleOfVisits extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
            let visits = this.getSecondaryActions(this.actor);
            for (let v of visits) {
              if (this.dominates(v)) {
                let info = this.game.createInformation(
                  "RoleInfo",
                  this.actor,
                  this.game,
                  v
                );
                info.processInfo();
                this.actor.queueAlert(`:invest: ${info.getInfoFormated()}.`);
              }
            }
          },
      },
    ];
  }
};
