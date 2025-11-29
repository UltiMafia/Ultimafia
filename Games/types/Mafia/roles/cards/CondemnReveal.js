const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class CondemnReveal extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal Role": {
        states: ["Dusk"],
        flags: ["voting"],
        shouldMeet: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn")){
              if(action.dominates(action.target, false)){
                return true;
              }
            }
            else if(action.target == this.player && action.hasLabel("frustration")){
              if(action.dominates(action.target, false)){
                return true;
              }
            }

          return false;
        },
        action: {
          labels: ["reveal"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            let info = this.game.createInformation(
              "RevealInfo",
              this.actor,
              this.game,
              this.target,
              null,
              "Faction"
            );
            info.processInfo();
            info.getInfoRaw();
            //this.target.role.revealToAll();
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
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 6,
        length: 1000 * 30,
        shouldSkip: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
      */
    };
  }
};
