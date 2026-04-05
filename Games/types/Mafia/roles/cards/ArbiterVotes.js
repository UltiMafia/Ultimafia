const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ArbiterVotes extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Information"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.role.data.VoteLog == null) return;
          for (let info of this.role.data.VoteLog) {
            info.processInfo();
            this.actor.queueAlert(info.getInfoFormated());
          }
          this.role.data.VoteLog = [];
        },
      },
    ];

    this.listeners = {
      PreVotingPowers: function (meeting) {
        if (this.data.VoteLog == null) {
          this.data.VoteLog = [];
        }

        let info = this.game.createInformation(
          "EvilVotingInfo",
          this.actor,
          this.game,
          meeting
        );
        this.data.VoteLog.push(info);
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.data.VoteLog = [];
        }
      },
    };
  }
};