const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class DiesWithVillageCondemn extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      meetingFinish: function (meeting) {
        if (this.player.alive && meeting.name === "Village") {
          const that = this;
          const villagers = meeting.members.filter(
            (e) => e.player.role.alignment === "Village"
          );
          const villagersCount = villagers.length;
          const villagersVotingFor = villagers
            .map((e) => meeting.votes[e.id])
            .filter((e) => e === that.player.id).length;
          if (villagersCount === villagersVotingFor) {
            this.player.kill("condemn", this.player);
          }
        }
      },
    };
  }
};
