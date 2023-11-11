const Item = require("../../Item");
const Action = require("../Action");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class Crossbow extends Item {
  constructor(options) {
    super("Crossbow");

    this.cursed = options?.cursed;
    this.meetings = {
      "Get Revenge": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.holder && action.hasLabel("condemn"))
              return true;

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          item: this,
          run: function () {
            this.item.drop();

            var cursed = this.item.cursed;
            if (cursed) {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["reveal"],
                run: function () {
                  if (this.dominates()) 
                  this.target.role.revealToAll();
                },
              });
              action.do();
              return;
            }

            if (this.dominates())
              this.target.kill("condemnRevenge", this.actor);
          },
        },
      },
    };
    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.holder && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
    };
  }
};
