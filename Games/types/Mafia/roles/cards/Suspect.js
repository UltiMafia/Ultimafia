const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Suspect extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        run: function () {
          if (this.game.getStateName() !== "Night") return;

          if (!this.actor.alive) return;

          let visits = this.getVisits(this.actor);
          let notSameVisitors = 
            visits.filter((v) => v.role.alignment !== this.role.alignment)?.length > 0;
          if (notSameVisitors)
            this.actor.kill("otherAlignment", this.actor);
        },
      }
    ];  
  }
};
