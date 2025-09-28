const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT, PRIORITY_PREKILL_ACTION, PRIORITY_DAY_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class AnnouceNeighborVisitors extends Card {
  constructor(role) {
    super(role);

        this.meetings = {
      "Open the Door": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          role: this.role,
          run: function () {
            if (this.target == "No") return;

            this.role.leftATrail = true;
            for(let player of this.game.players){
              if(player.isEvil()){
                player.queueAlert(`The ${this.role.name} left a trail of Moonstones!`);
              }
            }
            //this.game.queueAlert(`The ${this.role.name} left a trail of Moonstones!`);
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information", "OnlyWhenAlive"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action1 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_PREKILL_ACTION,
          labels: [
            "investigate",
            "alerts",
            "hidden",
            "absolute",
            "uncontrollable",
          ],
          role: this.role,
          run: function () {
            if(){
              
            }
            let this.role.neighbors = this.actor. getNeighbors();
          },
        });

        this.game.queueAction(action1);
        
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3,
          labels: [
            "investigate",
            "alerts",
            "hidden",
            "absolute",
            "uncontrollable",
          ],
          role: this.role,
          run: function () {
            let info = this.game.createInformation(
              "WatcherInfo",
              this.actor,
              this.game,
              this.actor,
              true
            );
            info.processInfo();
            let visitors = info.getInfoRaw();

            if (visitors?.length) {
              let names = visitors?.map((visitor) => visitor.name);

              this.game.queueAlert(
                `:loud: Someone shouts during the night: ` +
                  `Curses! ${names.join(", ")} disturbed my slumber!`
              );
              this.actor.role.data.visitors = [];
            }

            let info2 = this.game.createInformation(
              "ReportsInfo",
              this.actor,
              this.game,
              this.actor
            );
            info2.processInfo();
            let reports = info2.getInfoRaw();

            for (let report of reports) {
              this.game.queueAlert(
                `:loud: ${addArticle(
                  this.actor.getRoleAppearance()
                )} is overheard reading: ${report}`
              );
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
