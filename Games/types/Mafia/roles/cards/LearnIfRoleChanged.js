const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnIfRoleChanged extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-2,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
           this.actor.queueAlert(`Your role is ${this.actor.role.name}`);
        },
      },
    ];
  }
};
