const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        states: ["Day"],
        flags: ["group", "speech"],
        whileDead: true,
        speakDead: true,
      },
      Nominate: {
        states: ["Day"],
        flags: ["voting", "instant"],
        //whileDead: false,
        shouldMeet: function () {
          return true;
        },
        action: {
          labels: ["nominate"],
          run: function () {
            this.game.queueAlert(`${this.actor.name} nominates ${this.target.name}.`);

            let ballot = this.actor.holdItem("VotingBallot", this.target);
            this.game.instantMeeting(ballot.meetings, this.game.players);
            this.game.queueAlert("SLAYY");
          },
        }
      }
    };
  }
};
