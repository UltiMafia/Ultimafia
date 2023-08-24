const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ProtectNeighborsIfBothTown extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run: function () {
          if (!this.actor.alive) return;

          const neighbors = this.getAliveNeighbors();
          const allNeighborsGood =
            neighbors.filter(
              (p) =>
                p.role.alignment == "Village" || p.role.winCount == "Village"
            ).length == 2;

          if (!allNeighborsGood) return;

          for (let n of neighbors) {
            n.giveEffect("Immortal", 5, 1);
          }
        },
      },
    ];
  }
};
