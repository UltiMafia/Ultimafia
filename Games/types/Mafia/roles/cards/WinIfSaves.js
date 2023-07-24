const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfSaves extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (
          this.player.alive &&
          (this.data.noDeathCounter >= 4 ||
            this.savedCounter >= 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      // counts number of phases without deaths
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.data.noDeathCounter = 0;
        this.savedCounter = 0;
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/(Night|Day)/)) {
          this.data.noDeathCounter += 1;
        }
      },
      death: function () {
        this.data.noDeathCounter = 0;
      },
    };
  }
};
