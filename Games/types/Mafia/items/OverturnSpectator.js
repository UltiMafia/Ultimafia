const Item = require("../Item");

module.exports = class OverturnSpectator extends Item {
  constructor(reveal) {
    super("Overturn Spectator");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Overturn Vote": {
        meetingName: "Overturn",
        states: ["Dusk"],
        flags: ["group", "speech"],
      },
    };
  }
};
