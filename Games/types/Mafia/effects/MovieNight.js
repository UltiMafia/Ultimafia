const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../const/Priority");

module.exports = class MovieNight extends Effect {
  constructor(lifespan) {
    super("MovieNight");
    this.lifespan = lifespan || 1;
    this.listeners = {
      state: function () {
        if (this.game.getStateName() != "Night") return;

        var action = new Action({
          labels: ["hidden"],
          actor: null,
          target: null,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-10,
          run: function () {
            let info = this.game.createInformation(
              "CountEvilsInGroupInfo",
              null,
              this.game,
              this.game.MovieWatchers
            );
            info.makeTrue();
            this.game.MovieWatchers = Random.randomizeArray(this.game.MovieWatchers);
            this.game.MovieWatchers[0].queueAlert(
                `${info.mainInfo} Evil players attended the Movie!`
              );
            this.game.MovieWatchers[1].queueAlert(
                `${info.mainInfo} Evil players attended the Movie!`
              );
            info.makeFalse();
            this.game.MovieWatchers[2].queueAlert(
                `${info.mainInfo} Evil players attended the Movie!`
              );
            this.game.MovieWatchers = null;
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
