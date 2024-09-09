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
        shouldMeet: function (meetingName) {
          //let lunatics = this.game.players.filter((p) => p.hasItem("IsTheLunatic"));
          return !this.player.hasItem("IsTheTelevangelist");
        },
      },
      "Cult ": {
        actionName: "End Cult Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
        shouldMeet: function (meetingName) {
          let lunatics = this.game.players.filter((p) =>
            p.hasItem("IsTheTelevangelist")
          );
          return (
            lunatics.length > 0 &&
            (this.player.hasItem("IsTheTelevangelist") ||
              (!this.game
                .getRoleTags(this.player.role.name)
                .join("")
                .includes("Endangered") &&
                !this.game
                  .getRoleTags(this.player.role.name)
                  .join("")
                  .includes("Kills Cultist")))
          );
        },
      },
    };
  }
};
