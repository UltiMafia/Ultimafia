const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
  PRIORITY_PREKILL_ACTION,
  PRIORITY_DAY_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class AnnouceNeighborVisitors extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Go Trick or Treating": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          role: this.role,
          run: function () {
            if (this.target == "No") return;

            this.role.leftATrail = true;
            for (let player of this.game.players) {
              if (player.isEvil()) {
                player.queueAlert(`The ${this.role.name} is going to play a trick on their neigbors!`);
              }
            }
            //this.game.queueAlert(`The ${this.role.name} left a trail of Moonstones!`);
          },
        },
      },
    };


     this.passiveActions = [
      {
        ability: ["Information", "OnlyWhenAlive"],
        state: "Night",
        actor: role.player,
          game: role.player.game,
          priority: PRIORITY_PREKILL_ACTION,
          labels: [
            "investigate",
            "alerts",
            "hidden",
            "absolute",
            "uncontrollable",
          ],
          role: role,
          run: function () {
            if (this.role.leftATrail != true) {
              return;
            }
            this.role.neighborsForTrail = this.actor.getNeighbors();
          },
      },
      {
        ability: ["Information", "OnlyWhenAlive"],
        state: "Night",
        actor: role.player,
          game: role.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3,
          labels: [
            "investigate",
            "alerts",
            "hidden",
            "absolute",
            "uncontrollable",
          ],
          role: role,
          run: function () {
            if (this.role.neighborsForTrail.length <= 0) {
              return;
            }
            if (this.role.leftATrail != true) {
              return;
            }
            let visitors = [];
            for (let neighbor of this.role.neighborsForTrail) {
              let info = this.game.createInformation(
                "WatcherInfo",
                this.actor,
                this.game,
                neighbor,
                true
              );
              info.processInfo();
              visitors.push(...info.getInfoRaw());
            }

            if (visitors.length > 0) {
              visitors = Random.randomizeArray(visitors);
              let names = visitors?.map((visitor) => visitor.name);

              this.game.queueAlert(
                `:loud: As the ${this.role.name} prepared a trick. They saw` +
                  ` ${names.join(", ")} visiting their neighbors!`
              );
            }
            this.role.neighborsForTrail = [];
            this.role.leftATrail = false;
          },
      },

    ];

  }
};
