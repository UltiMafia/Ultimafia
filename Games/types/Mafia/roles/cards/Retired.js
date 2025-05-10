const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Retired extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        ModDisable: function (meetingName) {
          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
              return true;
            }
          }
          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w] || !meetingName) {
              return true;
            }
          }
          if (meetingName == "Graveyard") return true;

          return false;
        },
      },
    };

    this.listeners = {
      SwitchRoleBefore: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        for (let item of this.player.items) {
          item.drop();
        }
        let info = this.game.createInformation(
          "RevealPlayersWithRoleInfo",
          this.holder,
          this.game,
          null,
          this.player.role.name
        );
        info.processInfo();
        info.getInfoRaw();

        if (info.mainInfo.length <= 0) {
          this.holder.queueAlert(
            `You are a retired ${this.player.role.name}. You know that no one in this town is a ${this.player.role.name}`
          );
        } else {
          this.holder.queueAlert(
            `You are a retired ${this.player.role.name}. You remember a few people you worked with!`
          );
        }

        //this.player.holdItem("Retirement", this.player.role.name);

        let newRole = "Sidekick";
        let currRole = this.player.role.name;

        if (this.player.role.alignment == "Independent") {
          this.player.setRole(
            "Sidekick",
            undefined,
            false,
            true,
            false,
            "No Change"
          );
          this.player.role.data.OldRole = currRole;
        }
      },
    };
  }
};
