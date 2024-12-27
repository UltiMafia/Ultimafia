const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const {  PRIORITY_COPY_ACTIONS } = require("../../const/Priority");

module.exports = class GlobalModifier extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Dawn/)) {
          return;
        }
          let actions = [];
          for (let action of this.game.actions[0]) {
              if (
                action.actor == this.player && action.target instanceof Player && action.target != this.player && !action.hasLabels(["kill", "mafia"])
              ) {
                actions.push(action);
              }
            }

        for(let visit of actions){
          for(let person of this.game.alivePlayers()){
              if(person != action.target){
                var actionCopy = new Action({
                  actor: action.actor,
                  target: person,
                  game: action.game,
                  meeting: action.meeting,
                  priority: action.priority,
                  labels: action.labels,
                  run: action.unboundRun,
                  power: action.power,
                  item: action.item,
                  effect: action.effect,
                  delay: action.delay,
                })
                this.game.queueAction(action);
              }
          }
        }
      },
    };
  }
};
