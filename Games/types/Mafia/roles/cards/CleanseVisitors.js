const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_EFFECT_REMOVER_DEFAULT,
  PRIORITY_CLEANSE_LYCAN_VISITORS,
  PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
  PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
  PRIORITY_KILL_DEFAULT,
  PRIORITY_EFFECT_REMOVER_EARLY,
} = require("../../const/Priority");
module.exports = class CleanseVisitors extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Effect"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_REMOVER_DEFAULT,
          labels: ["cleanse", "hidden"],
          run: function () {
            let visitors = this.getVisitors();

            for (let visitor of visitors) {
              this.heal(1, visitor);
            }

            for (let action of this.game.actions[0]) {
              if (action.target == this.actor && !action.hasLabel("hidden")) {
                this.cleanse(1, action.actor);
              }
            }
          },
        });

        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_CLEANSE_LYCAN_VISITORS,
          labels: ["cleanse", "lycan", "hidden"],
          run: function () {
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
        });

        var action3 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
          labels: ["cleanse", "hidden"],
          run: function () {
            const alcoholicVisitors = this.getVisitors().filter((p) =>
              p.hasEffect("Alcoholic")
            );
            for (const v of alcoholicVisitors) {
              v.removeEffect("Alcoholic", true);
              this.blockActions(v, "alcoholic");
            }
          },
        });

        var action4 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
          run: function () {
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
        });

        var action5 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          power: 2,
          labels: ["kill", "hidden"],
          run: function () {
            var werewolfVisitors = this.actor.role.data.werewolfVisitors;
            if (werewolfVisitors) {
              for (let visitor of werewolfVisitors)
                if (this.dominates(visitor)) visitor.kill("basic", this.actor);
              this.actor.role.data.werewolfVisitors = [];
            }
          },
        });

          var action6 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_REMOVER_EARLY,
          labels: ["cleanse", "hidden"],
          run: function () {
            let visitors = this.getVisitors();

            for (let visitor of visitors) {
              this.heal(1, visitor);
            }

            for (let action of this.game.actions[0]) {
              if (action.target == this.actor && !action.hasLabel("hidden")) {
                this.cleanse(1, action.actor);
              }
            }
          },
        });

        this.game.queueAction(action);
        this.game.queueAction(action2);
        this.game.queueAction(action3);
        this.game.queueAction(action4);
        this.game.queueAction(action5);
        this.game.queueAction(action6);
      },
    };
  }
};
