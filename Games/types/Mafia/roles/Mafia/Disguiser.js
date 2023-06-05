const Role = require("../../Role");
const { PRIORITY_LEADER_DISGUISER } = require("../../const/Priority");

module.exports = class Disguiser extends Role {
  constructor(player, data) {
    super("Disguiser", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "IdentityStealer",
    ];
    this.meetingMods = {
      Mafia: {
        leader: PRIORITY_LEADER_DISGUISER,
      },
    };
  }
};
