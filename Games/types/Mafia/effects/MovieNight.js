const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../const/Priority");

module.exports = class MovieNight extends Effect {
  constructor(isRandom, lifespan) {
    super("MovieNight");
    this.lifespan = lifespan || 1;
    this.isRandom = isRandom;
    this.listeners = {
      state: function () {
        if (this.isRandom) {
          if (this.game.getStateName() == "Day") {
            var actionDay = new Action({
              labels: ["hidden"],
              actor: null,
              target: null,
              game: this.player.game,
              priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
              run: function () {
                let alive = this.game.alivePlayers();
                if (alive.length >= 3) {
                  alive = Random.randomizeArray(alive);
                  this.game.MovieWatchers = [alive[0], alive[1], alive[2]];
                  this.game.queueAlert(
                    `${this.game.MovieWatchers[0].name}, ${this.game.MovieWatchers[1].name}, and ${this.game.MovieWatchers[2].name} will be attending the Opera tonight!`
                  );
                }
              },
            });

            this.game.queueAction(actionDay);
          }
        }
        if (this.game.getStateName() != "Night") return;

        var action = new Action({
          labels: ["hidden"],
          actor: null,
          target: null,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          run: function () {
            let info = this.game.createInformation(
              "CountEvilsInGroupInfo",
              null,
              this.game,
              this.game.MovieWatchers
            );
            info.makeTrue();
            this.game.MovieWatchers = Random.randomizeArray(
              this.game.MovieWatchers
            );
            this.game.MovieWatchers[0].queueAlert(
              `${info.mainInfo} Evil players attended the opera!`
            );
            this.game.MovieWatchers[1].queueAlert(
              `${info.mainInfo} Evil players attended the opera!`
            );
            info.makeFalse();
            this.game.MovieWatchers[2].queueAlert(
              `${info.mainInfo} Evil players attended the opera!`
            );
            this.game.MovieWatchers = null;
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
