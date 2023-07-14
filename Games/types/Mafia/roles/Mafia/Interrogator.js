const Role = require("../../Role");
const {MEETING_PRIORITY_JAIL} = require("../../const/MeetingPriority");
const {PRIORITY_DAY_DEFAULT} = require("../../const/Priority");

module.exports = class Interrogator extends Role {
  constructor(player, data) {
    super("Interrogator", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "JailTarget"];

    this.meetingMods = {
      "Jail Target": {
          "action.priority": PRIORITY_DAY_DEFAULT - 1
      },
      "JailPlaceholder": {
          "action.priority": MEETING_PRIORITY_JAIL - 1
      }
  }
}

}