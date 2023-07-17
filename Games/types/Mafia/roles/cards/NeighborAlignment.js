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

          let neighbors = getAliveNeighbors();

          let alignments = [neighbors[0].role.alignment, neighbors[1].role.alignment];
          let counts = alignments.filter((p) => p !== "Village");
          let countsNum = counts.length;

          this.actor.queueAlert(`You learn that ${countsNum} of your neighbors ${countsNum == 1 ? 'is' : 'are'} evil!`);
        },
      }
    ];
  }
};
