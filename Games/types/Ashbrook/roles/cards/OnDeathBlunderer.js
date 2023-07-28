const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class OnDeathBlunderer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        states: ["Sunset", "Dawn"],
        flags: ["voting", "mustAct"],
        whileDead: true,
        shouldMeet: function() {
          return this.data.blunderer;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            if (this.target.role.alignment == "Follower" || 
              this.target.role.alignment == "Leader"){
              this.game.queueAlert("Your target was evil!");
              this.game.evilWin = true;
            } else {
              this.actor.queueAlert("Your target wasn't evil!");
            }
            this.actor.role.data.blunderer = false;
          },
        },
      },
    };

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        
        this.data.blunderer = true;
      }
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          return !this.data.blunderer;
        }
      },
      Night: {
        type: "delayActions",
        delayActions: true,
      },
      Dawn: {
        type: "add",
        index: 3,
        length: 1000 * 30,
        shouldSkip: function () {
          return !this.data.blunderer;
        },
      },
    };
  }
}
