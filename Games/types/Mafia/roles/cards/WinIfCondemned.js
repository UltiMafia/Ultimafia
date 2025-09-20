const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfCondemned extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.data.condemned && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
        } else if (
          confirmedFinished &&
          this.canDoSpecialInteractions() &&
          this.hasBeenRoomLeader &&
          this.hasBeenRoomLeader.length >= 2 &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "condemn")
          this.data.condemned = true;
      },
      ElectedRoomLeader: function (leader, room, HasChanged) {
        if (!this.canDoSpecialInteractions()) {
          return;
        }
        if (leader != this.player) {
          return;
        }
        if (!this.hasBeenRoomLeader) {
          this.hasBeenRoomLeader = [];
        }
        if (this.hasBeenRoomLeader.includes(room.name)) {
          return;
        }
        this.hasBeenRoomLeader.push(room.name);
      },
    };
  }
};
