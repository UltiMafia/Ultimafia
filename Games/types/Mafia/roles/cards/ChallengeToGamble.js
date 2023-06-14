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
          run() {
            this.target.queueAlert("You have received a gamble challenge!");

            const challengeA = this.target.holdItem(
              "GambleChallenge",
              this.actor
            );
            const challengeB = this.actor.holdItem(
              "GambleChallenge",
              this.actor
            );

            for (const a of this.actor.role.actions) {
              if (a.type == "gamble") {
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
        run() {
          if (this.game.getStateName() != "Night") return;

          if (!this.target) {
            return;
          }

          const gambleKey = `gamble@${this.actor.name}`;
          const gambledPick = this.target.role.data[gambleKey];
          const gamblerPick = this.actor.role.data[gambleKey];
          if (gambledPick == undefined || gamblerPick == undefined) {
            return;
          }

          const rpsMap = {
            Rock: 0,
            Paper: 1,
            Scissors: 2,
          };
          const result = (rpsMap[gamblerPick] - rpsMap[gambledPick] + 3) % 3;
          let gambledResult;
          let gamblerResult;
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

          const alertTarget = `You played ${gambledPick} and ${gambledResult} the challenge.`;
          this.target.queueAlert(alertTarget);
          const alertGambler = `You played ${gamblerPick} and ${gamblerResult} the challenge.`;
          this.actor.queueAlert(alertGambler);

          for (const a of this.actor.role.actions) {
            if (a.type == "gamble") {
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
