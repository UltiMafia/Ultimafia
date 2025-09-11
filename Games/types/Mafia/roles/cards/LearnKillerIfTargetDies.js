const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_PREKILL_ACTION } = require("../../const/Priority");

module.exports = class LearnKillerIfTargetDies extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Witness: {
        actionName: "Witness",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_PREKILL_ACTION,
          role: this.role,
          run: function () {
            this.role.data.playerToWitness = this.target;
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.data.playerToWitness = null;
        }
      },
      death: function (player, killer, deathType, instant) {
        if (this.data.playerToWitness && player == this.data.playerToWitness) {
          if (!this.hasAbility(["Information"])) {
            return;
          }

          let action = new Action({
            actor: this.player,
            target: killer,
            game: this.game,
            labels: ["investigate"],
            role: this,
            run: function () {
                if(this.target == null){
            this.actor.queueAlert(`You learn that ${this.role.data.playerToWitness.name} died of natural causes!`);
            return;
                }
              if (this.dominates()){
                let info = this.game.createInformation(
              "LearnTargetAndNotInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            this.actor.queueAlert(
              `You learn that ${this.role.data.playerToWitness.name} was killed by ${info.getInfoRaw()}!`
            );
              }
                
            },
          });

          action.do();

          //this.data.playerToReveal.role.revealToAll();
        }
      },
    };
  }
};
