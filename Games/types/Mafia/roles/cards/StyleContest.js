const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_EFFECT_GIVER_DEFAULT, PRIORITY_EFFECT_GIVER_EARLY } = require("../../const/Priority");

module.exports = class StyleContest extends Card {
  constructor(role) {
    super(role);

    role.AllTasksComplete = false;
    let targets = ["Make all info false tonight", "Gain an extra mafia role ability"];
    let roles = role.getAllRoles();
    roles = roles.map((r) => r.split(":")[0]);
    if(roles.includes("Butterfly") && role.canDoSpecialInteractions()){
      targets.push("Revive all dead players as random independent roles");
    }

    this.meetings = {
      "Prize Time": {
        actionName: "Choose Reward",
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: targets,
        shouldMeet: function () {
          return this.AllTasksComplete;
        },
        action: {
          labels: ["Special"],
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          role: this.role,
          run: function () {
            if(this.target == "Make all info false tonight"){
              for(let player of this.game.players){
                player.giveEffect("FalseMode", 1);
              }
            }
            else if(this.target == "Gain an extra mafia role ability"){
              const randomMafiaRole = Random.randArrayVal(
              this.role
                .getAllRoles()
                .filter((r) => this.game.getRoleAlignment(r) == "Mafia")
            );
                let role = this.actor.addExtraRole(randomMafiaRole);
              //this.GainedRoles.push(role);
              this.actor.passiveExtraRoles.push(role);
            }
            else if(this.target == "Revive all dead players as random independent roles"){
          let convert = new Action({
          actor: this.actor,
          game: this.actor.game,
          labels: ["convert", "hidden"],
          role: this.role,
          run: function () {
            }
          },
        });
              for(let player of this.game.players){
                if(!player.alive && convert.dominates(player)){
                  let indieRoles = this.role.getAllRoles().filter((r) => this.game.getRoleAlignment(r) == "Independent");
            if(indieRoles.length <= 0){
              indieRoles = ["Survivor", "Fool", "Hitchhiker", "Nomad"]
            }
              const randomThirdRole = Random.randArrayVal(indieRoles);
                
            player.setRole(
              randomThirdRole,
              null,
              false,
              false,
              false,
            );
                }
              }
            }
            this.role.AllTasksComplete = false;
          },
        },
      },
    };

    this.listeners = {
      state: function () {
         if (this.game.getStateName() == "Night"){
           var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["role", "hidden"],
          role: this,
          run: function () {
          this.role.AllTasksComplete = false;
          let subaction = new Action({
          actor: this.actor,
          game: this.actor.game,
          labels: ["role", "hidden"],
          role: this.role,
          run: function () {
            if(!this.role.TaskComp){
              this.role.TaskComp = [];
            }
            if(this.target){
              this.role.TaskComp.push(this.target);
            }
            let teammates = this.game.players.filter((p) => p.faction == this.actor.faction && p.alive);
            if(teammates && teammates.length > 0){
              for(let player of teammates){
                if(!this.role.TaskComp.includes(player)){
                  return;
                }
              }
            this.role.AllTasksComplete = true
            }
          },
        });
          let teammates = this.game.players.filter((p) => p.faction == this.actor.faction);
          for(let player of teammates){
            if(player.alive){
              player.giveEffect("DayTask", this.role, player, subaction, null, teammates.length-teammates.filter((p)=> p.alive));
            }
          }
          },
        });

        this.game.queueAction(action);
         }
        /*
        if (this.game.getStateName() == "Day") {
          let contest = [];
          for (let player of this.game.players) {
            if (player.data.StylePoints > 0) {
              contest.push(player);
            }
          }
          for (let member of contest) {
            this.game.queueAlert(
              `${member.name} has ${member.data.StylePoints} Style Points!`,
              0,
              this.game.players.filter(
                (p) => p.role.alignment === this.player.role.alignment
              )
            );
          }
        }
        */
      },
    };
  }
};
