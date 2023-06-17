const Action = require("../../../../core/Action");
const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class ChallengeToGamble extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Gamble with": {
        states: ["Night"],
        flags: ["voting", "instant"],
        action: {
          labels: ["gamble"],
          run: function () {
            this.target.queueAlert("You have received a gamble challenge!");

            let challengeA = this.target.holdItem("GambleChallenge", this.actor);
            let challengeB = this.actor.holdItem("GambleChallenge", this.actor);

            for (let a of this.actor.role.actions) {
              if (a["type"] == "gamble") {
                a.target = this.target;
                break;
              }
            }

            this.game.instantMeeting(challengeA.meetings, [this.target]);
            this.game.instantMeeting(challengeB.meetings, [this.actor]);
          },
        },
      },
    };

    this.actions = [
      {
        type: "gamble",
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.target) {
            return;
          }

          let gambleKey = `gamble@${this.actor.name}`;
          let gambledPick = this.target.role.data[gambleKey];
          let gamblerPick = this.actor.role.data[gambleKey];
          if (gambledPick == undefined || gamblerPick == undefined) {
            return;
          }

          let rpsMap = {
            Rock: 0,
            Paper: 1,
            Scissors: 2,
          };
          let result = (rpsMap[gamblerPick] - rpsMap[gambledPick] + 3) % 3;
          var gambledResult;
          var gamblerResult;
          switch (result) {
            case 0:
              // tie
              gambledResult = "tied";
              gamblerResult = "tied";
              break;
            case 1:
              // gambler win
              gambledResult = "lost";
              gamblerResult = "won";
              this.actor.role.gambleWins += 1;
              if (this.dominates()) {
                this.target.kill("basic", this.actor);
              }
              break;
            case 2:
              // gambled lost
              gambledResult = "won";
              gamblerResult = "lost";
              break;
          }

          let alertTarget = `You played ${gambledPick} and ${gambledResult} the challenge.`;
          this.target.queueAlert(alertTarget);
          let alertGambler = `You played ${gamblerPick} and ${gamblerResult} the challenge.`;
          this.actor.queueAlert(alertGambler);

          for (let a of this.actor.role.actions) {
            if (a["type"] == "gamble") {
              delete a.target;
              break;
            }
          }

          delete this.target.role.data[gambleKey];
          delete this.target.role.data[gambleKey];
        },
      },
    ];
  }
};
