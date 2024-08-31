const Card = require("../../Card");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
const {  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");

module.exports = class KillVillagePlayerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Choose Player": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          for (let action of this.game.actions[0])
            if (((action.target == this.player && action.hasLabel("condemn")) || !this.player.alive) && !this.SelectedPlayer)
              return true;

          return false;
        },
        action: {
          labels: ["select"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            
             // this.target.kill("condemnRevenge", this.actor);
             this.game.queueAlert(
              `${this.actor.name} the ${this.actor.role.name} has selected ${this.target.name}. If ${this.target.name} is Village Aligned they will die tonight.`
            );
            //this.hasChoosen = true;
            this.actor.role.SelectedPlayer = this.target;
            
          },
        },
      },
      "Choose Player": {
        states: ["Sunrise"],
        flags: ["voting"],
        shouldMeet: function () {
          for (let action of this.game.actions[0])
            if (((action.target == this.player && action.hasLabel("condemn")) || !this.player.alive) && !this.SelectedPlayer)
              return true;

          return false;
        },
        action: {
          labels: ["select"],
          priority:  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-5,
          run: function () {
            
             // this.target.kill("condemnRevenge", this.actor);
             this.game.queueAlert(
              `${this.actor.name} the ${this.actor.role.name} has selected ${this.target.name}. If ${this.target.name} is Village Aligned they will die tonight.`
            );
            //this.hasChoosen = true;
            this.actor.role.SelectedPlayer = this.target;
            
          },
        },
      },
    };

(this.actions = [
        {
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["hidden", "kill"],
          run: function () {
            if (this.game.getStateName() != "Night") return;

            if(!this.actor.role.SelectedPlayer) return;
            if(this.actor.role.SelectedPlayer.role.alignment != "Village") return;

            this.actor.role.SelectedPlayer.kill("basic", this.actor);
          },
        },
      ]);



    
    this.stateMods = {
      Sunset: {
        type: "add",
        index: 6,
        length: 1000 * 30,
        shouldSkip: function () {
          for (let action of this.game.actions[0]){
            if (((action.target == this.player && action.hasLabel("condemn")) || !this.player.alive) && !this.SelectedPlayer){
              return false;
            }
          }

          return true;
        },
      },
      Sunrise: {
        type: "add",
        index: 3,
        length: 1000 * 60,
        shouldSkip: function () {
          for (let action of this.game.actions[0]) {
            if ((!this.player.alive) && !this.SelectedPlayer) {
              return false;
            }
          }
          return true;
        },
      },
    };
  }
};
