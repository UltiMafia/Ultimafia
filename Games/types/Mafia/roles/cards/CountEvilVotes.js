const Card = require("../../Card");
//const Action = require("../../../../core/Action");
const Action = require("../../Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CountEvilVotes extends Card {
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
          if (this.role.data.VotingLog == null) return;
          for (let info of this.role.data.VotingLog) {
            info.processInfo();
            this.actor.queueAlert(info.getInfoFormated());
          }
          this.role.data.VotingLog = [];
        },
      },
    ];

    this.listeners = {
      PreVotingPowers: function (meeting) {
        let isValid = false;

        for (let member of meeting.members) {
          if (member.player.name == this.player.name) {
            isValid = true;
          }
        }
        if(!isValid){
          return;
        }
        if (this.data.VotingLog == null) {
          this.data.VotingLog = [];
        }

        let info = this.game.createInformation(
          "EvilVotingInfo",
          this.actor,
          this.game,
          meeting
        );

        this.data.VotingLog.push(info);
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.data.VotingLog = [];
        }
      },
    };
  }
};
