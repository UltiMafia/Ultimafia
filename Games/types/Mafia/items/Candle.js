const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class Candle extends Item {
  constructor(options, lifespan) {
    super("Candle");

    this.lifespan = lifespan || Infinity;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") return;

        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          labels: ["hidden"],
          run: function () {


            let info = this.game.createInformation(
              "WatcherInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfoItem(this.item);
            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
