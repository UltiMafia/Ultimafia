const Card = require("../../Card");
const {
  PRIORITY_EFFECT_REMOVER_DEFAULT,
  PRIORITY_CLEANSE_LYCAN_VISITORS,
  PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
  PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class CleanseVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_REMOVER_DEFAULT,
        labels: ["cleanse", "hidden"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.cleanse(1);
        },
      },
      //lycan cleansing
      {
        priority: PRIORITY_CLEANSE_LYCAN_VISITORS,
        labels: ["cleanse", "lycan", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var cleansedWolves = {};

          for (let action of this.game.actions[0]) {
            if (
              action.target == this.actor &&
              action.actor.hasEffect("Lycan") &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              action.actor.removeEffect("Lycan", true);
              cleansedWolves[action.actor.id] = true;
            }
          }

          if (Object.keys(cleansedWolves).length == 0) return;

          for (let action of this.game.actions[0]) {
            if (
              action.actor &&
              cleansedWolves[action.actor.id] &&
              action.hasLabels(["kill", "lycan"])
            ) {
              action.cancel();
            }
          }
        },
      },
      //alcoholic cleansing
      {
        priority: PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
        labels: ["cleanse", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          const alcoholicVisitors = this.getVisitors().filter((p) =>
            p.hasEffect("Alcoholic")
          );
          for (const v of alcoholicVisitors) {
            v.removeEffect("Alcoholic", true);
            this.blockActions(v, "alcoholic");
          }
        },
      },
      // Store visitors before triggering kills since killing modifies visitor behavior
      {
        priority: PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0])
            if (
              action.target == this.actor &&
              action.actor.role.name == "Werewolf" &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              if (!this.actor.role.data.werewolfVisitors)
                this.actor.role.data.werewolfVisitors = [];

              this.actor.role.data.werewolfVisitors.push(action.actor);
            }
        },
      },
      //werewolf killing
      {
        priority: PRIORITY_KILL_DEFAULT,
        power: 2,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var werewolfVisitors = this.actor.role.data.werewolfVisitors;

          if (werewolfVisitors) {
            for (let visitor of werewolfVisitors)
              if (this.dominates(visitor)) visitor.kill("basic", this.actor);

            this.actor.role.data.werewolfVisitors = [];
          }
        },
      },
    ];
  }
};
