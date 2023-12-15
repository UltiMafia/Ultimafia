const Item = require("../Item");

const rpsRules = {
  Rock: "Scissors",
  Scissors: "Paper",
  Paper: "Rock",
};

module.exports = class Gamble extends Item {
  constructor(meetingName, gambler, challenger) {
    super("Gamble");

    this.lifespan = 1;
    this.meetingName = meetingName;
    this.gambler = gambler;
    this.challenger = challenger;
    this.cannotBeStolen = true;

    this.meetings[meetingName] = {
      actionName: "Rock, Paper, Scissors",
      states: ["Day"],
      flags: [
        "group",
        "voting",
        "anonymous",
        "mustAct",
        "instant",
        "votesInvisible",
        "noUnvote",
        "multiSplit",
        "hideAfterVote",
      ],
      inputType: "custom",
      targets: ["Rock", "Paper", "Scissors"],
      shouldMeet: function (meetingName) {
        let gamble = this.player.getItemProp(
          "Gamble",
          "meetingName",
          meetingName
        );
        return !!(gamble?.gambler.alive && gamble?.challenger.alive);
      },
      action: {
        item: this,
        labels: ["kill", "challenge"],
        run: function () {
          let challenger = this.item.challenger;
          let gambler = this.item.gambler;

          this.target = challenger;

          if (!gambler?.alive || !challenger?.alive) return;

          const gamblerVote = this.meeting.votes[gambler.id];
          const challengerVote = this.meeting.votes[challenger.id];

          if (!gamblerVote || !challengerVote) {
            return;
          }

          if (gamblerVote === challengerVote) {
            gambler.queueAlert("It's a tie, you go again…");
            challenger.queueAlert("It's a tie, you go again…");
            this.meeting.cancel(true, true);
            this.game.instantMeeting(this.item.meetings, [challenger, gambler]);
            return;
          }

          if (rpsRules[gamblerVote] === challengerVote) {
            gambler.queueAlert("You won the gamble!");
            challenger.queueAlert("You lost the gamble!");
            if (this.dominates(challenger)) {
              challenger.kill("gamble", gambler, true);
              gambler.role.data.gamblerWins++;
            }
          } else {
            gambler.queueAlert("You lost the gamble!");
            challenger.queueAlert("You won the gamble!");
          }
        },
      },
    };
  }
};
