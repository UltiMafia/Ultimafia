const Item = require("../Item");
const Action = require("../Action");
const Event = require("../Event");
const Random = require("../../../../lib/Random");
const roles = require("../../../../data/roles");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_BECOME_DEAD_ROLE,
} = require("../const/Priority");

module.exports = class EventManager extends Item {
  constructor(lifespan) {
    super("EventManager");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.listeners = {
      ManageRandomEvents: function () {
        if (this.game.getStateName() != "Night") return;
        let event;
        let eventMods;
        let eventName;
        if (this.game.PossibleEvents.length > 0 && !this.game.selectedEvent) {
          let Events = this.game.PossibleEvents.filter(
            (e) =>
              this.game.checkEvent(e.split(":")[0], e.split(":")[1]) == true
          );
          if (Events.length <= 0) {
            //this.game.queueAlert("Failed Checks");
            this.drop();
            return;
          }
          event = Random.randArrayVal(Events);
          eventMods = event.split(":")[1];
          eventName = event.split(":")[0];
          //this.game.queueAlert(`Manager ${eventMods}`);
          event = this.game.createGameEvent(eventName, eventMods);
          event.doEvent();
          event = null;
          this.game.selectedEvent = true;
          this.drop();
        } else {
          this.drop();
          return;
        }
      },
    };
  }
};
