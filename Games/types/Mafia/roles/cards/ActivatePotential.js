const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ActivatePotential extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Activate Potential": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.target === "No") return;
            let oldModifiers = this.actor.role.modifier;
            let newModifiers = oldModifiers.replace(/Activated/, "").replace("//", "/");
            this.actor.setRole(
              `${this.actor.role.name}:${newModifiers}`,
              this.actor.role.data
            );
            this.actor.queueAlert(
              "You decide to activate your full potential…"
            );
          },
        },
      },
    };

    this.meetingMods = {
      "*": {
        shouldMeet: function (meetingName) {
          // core meetings
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Cult"
          )
            return true;

          // self
          if (
            meetingName == "Activate Potential"
          )
            return true;
          
          // meetings invited by others
          if (
            meetingName == "Party!" ||
            meetingName == "Hot Springs" ||
            meetingName == "Banquet" ||
            meetingName.startsWith("Jail with") ||
            meetingName.startsWith("Seance with")
          ) {
            return true;
          } else return false;
        },
      },
    };
  }
};
