const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class NeighborAlignment extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          const neighbors = this.getAliveNeighbors();
          const evilCount = neighbors.filter((p) => p.role.alignment !== "Village").length;

          this.actor.queueAlert(`You learn that you have ${evilCount} evil neighbors!`);
        },
      },
    ];
  }
};
