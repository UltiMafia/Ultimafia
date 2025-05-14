const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../const/Priority");

module.exports = class Evil extends Effect {
  constructor(lifespan) {
    super("Evil");
    this.lifespan = lifespan || Infinity;


    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          confirmedFinished &&
          !winners.groups["Village"]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    
  }
};
