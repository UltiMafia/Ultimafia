const { addArticle } = require("../../../../core/Utils");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CauseBanishedEventsOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (this.player.alive) {
          return;
        }
        if (!this.hasAbility(["Event", "WhenDead"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        let event;
        let eventMods;
        let eventName;

        let Events = this.game.BanishedEvents.filter(
          (e) => this.game.checkEvent(e.split(":")[0], e.split(":")[1]) == true
        );
        if (Events.length <= 0) {
          return;
        }
        event = Random.randArrayVal(Events);
        eventMods = event.split(":")[1];
        eventName = event.split(":")[0];
        event = this.game.createGameEvent(eventName, eventMods);
        event.doEvent();
      },
    };
  }
};
