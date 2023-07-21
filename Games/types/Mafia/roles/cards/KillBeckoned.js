const Card = require("../../Card");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class KillBeckoned extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Beckon: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill", "hidden"],
          priority: PRIORITY_MAFIA_KILL -1,
          run: function () {
            if (!this.actor.role.data.beckoned) {
              this.actor.role.data.beckoned = 0;
            }
            const beckonedVisitor = this.getVisitors().includes(this.target);
            if (beckonedVisitor && this.dominates()) {
              this.actor.queueAlert(
                `:mermaid: You successfully beckon ${this.target.name} with your song, dragging them to a watery grave.`
              );
              this.target.kill("basic", this.actor);
              this.actor.role.data.beckoned++;
            }
          },
        },
      },
    };
  }
};
