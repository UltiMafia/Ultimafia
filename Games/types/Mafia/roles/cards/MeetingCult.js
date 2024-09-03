const Card = require("../../Card");

module.exports = class MeetingCult extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Cult: {
        actionName: "End Cult Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.player.hasItem("IsTheLunatic");
        },
      },
      Cult: {
        actionName: "End Cult Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        shouldMeet: function () {
          let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic");
          return (lunatics.length > 0 && (this.player.hasItem("IsTheLunatic") || !this.game.getRoleTags(this.player.role.name).includes("Endangered") && !this.game.getRoleTags(this.role.name).includes("Kills Cultist")));
        },
      },
    };
  }
};
