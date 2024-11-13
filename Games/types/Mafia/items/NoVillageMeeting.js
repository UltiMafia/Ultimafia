const Item = require("../Item");

// TODO this should semantically be an effect "SnowedIn" not item
module.exports = class NoVillageMeeting extends Item {
  constructor() {
    super("NoVillageMeeting");

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    /*
    this.meetings = {
      NoVillageMeeting: {
        actionName: "Done Waiting?",
        states: ["Day"],
        //flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        //inputType: "boolean",
        passiveDead: true,
        whileDead: true,
        speakDead: true,
      },
    };
*/
    /*
    this.listeners = {
      state: function () {
        const state = this.game.getStateName();
        if (state == "Day") {
          this.drop();
          return;
        }

        if (state != "Night") {
          return;
        }

        if (this.holder.role.alignment != "Cult") {
          this.holder.queueAlert(
            ":snowball: You're snowed in for the night… you cannot take any action!"
          );
        }
      },
    };
    */
  }

  shouldDisableMeeting(name) {
    // do not disable jailing, gov actions
    if (this.game.getStateName() != "Day") {
      return false;
    }

    if (name == "Village") {
      return true;
    }

    if (name == "Magus Game") {
      return true;
    }

    return false;
  }
};
