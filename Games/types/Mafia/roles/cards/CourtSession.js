const Card = require("../../Card");
const {
  PRIORITY_DAY_EFFECT_DEFAULT,
  PRIORITY_SUNSET_DEFAULT,
} = require("../../const/Priority");

module.exports = class CourtSession extends Card {
  constructor(role) {
    super(role);

    role.bangedGavel = 0;

    this.listeners = {
      PreVotingPowers: function (meeting) {
        if (this.data.master == 0) {
          return;
        }
        if (meeting.name == "Court") {
          this.VotePower = 3;
        }
      },
      PostVotingPowers: function (meeting) {
        this.VotePower = 1;
      },
    };

    this.meetings = {
      "Call Court": {
        actionName: "Call Court?",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          role: this.role,
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          run: function () {
            if (this.target === "Yes") {
              this.role.bangedGavel++;
              if (!this.actor.hasAbility(["Meeting"])) {
                return;
              }
              this.game.queueAlert(
                ":hammer: You have received a court summons…"
              );
              for (const player of this.game.players) {
                player.holdItem("JuryDuty");
              }
            }
          },
        },
      },
      Court: {
        states: ["Dusk"],
        flags: [
          "group",
          "speech",
          "voting",
          "anonymous",
          "mustAct",
          "useVotingPower",
        ],
        targets: { include: ["alive"], exclude: ["dead"] },
        leader: true,
        shouldMeet: function () {
          if (this.bangedGavel == 0 || this.bangedGavel == null) {
            return false;
          }
          if (this.courtAdjourned >= 2) {
            return false;
          }
          if (this.bangedGavel >= 3) {
            return false;
          }
          if (!this.player.alive) {
            return false;
          } else return true;
        },
        action: {
          power: 3,
          role: this.role,
          labels: ["kill", "condemn"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.kill("condemn", this.actor);
            }

            this.role.courtAdjourned++;
          },
        },
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      /*
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Court: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          if (this.bangedGavel == 0) {
            return true;
          }
          if (this.courtAdjourned >= 2) {
            return true;
          }
          if (this.bangedGavel >= 3) {
            return true;
          }
          if (!this.player.alive) {
            return true;
          } else return false;
        },
      },
      */
    };
  }
};
