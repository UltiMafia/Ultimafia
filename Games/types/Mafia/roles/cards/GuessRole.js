const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class GuessRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Pursue Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT - 1,
          run: function () {
            this.actor.role.data.targetPlayer = this.target;
          },
        },
      },
      "Guess Role": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let targetPlayer = this.actor.role.data.targetPlayer;
            if (targetPlayer) {
              if(!this.actor.hasEffect("FalseMode")){
              if (this.target === targetPlayer.role.name) {
                this.actor.queueAlert(
                  `:invest: You were not mistaken in pursuing ${
                    targetPlayer.name
                  } for they turned out to be ${addArticle(this.target)}.`
                );
              } else {
                this.actor.queueAlert(
                  `:invest: You were mistaken in pursuing ${
                    targetPlayer.name
                  } for they turned out not to be ${addArticle(this.target)}.`
                );
              }
            }
              else{
                if (this.target != targetPlayer.role.name) {
                this.actor.queueAlert(
                  `:invest: You were not mistaken in pursuing ${
                    targetPlayer.name
                  } for they turned out to be ${addArticle(this.target)}.`
                );
              } else {
                this.actor.queueAlert(
                  `:invest: You were mistaken in pursuing ${
                    targetPlayer.name
                  } for they turned out not to be ${addArticle(this.target)}.`
                );
              }
              }
              delete this.actor.role.data.targetPlayer;
            }
          },
        },
      },
    };
  }
};
