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

          let alive = this.game.alivePlayers();
          let index = alive.indexOf(this.actor);

          var left = alive[index-1]
          if (index == (alive.length - 1)){
            var right = alive[0];
          } else {
            var right = alive[index+1];
          }

          let alignments = [left.role.alignment, right.role.alignment];
          let counts = alignments.filter((p) => p !== "Village");
          let countsNum = counts.length;

          this.actor.queueAlert(`You learn that ${countsNum} of your neighbors ${countsNum == 1 ? 'is' : 'are'} evil!`);
        },
      }
    ];
  }
};
