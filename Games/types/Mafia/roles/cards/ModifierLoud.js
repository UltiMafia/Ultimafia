const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");
const { addArticle } = require("../../../../core/Utils");

module.exports = class ModifierLoud extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Leak Whispers"];
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2,
        labels: [
          "investigate",
          "alerts",
          "hidden",
          "absolute",
          "uncontrollable",
        ],
        run: function () {
          if (
            this.game.getStateName() != "Night" &&
            this.game.getStateName() != "Dawn"
          )
            return;

          let visitors = this.getVisitors();
          let MafiaKill = this.getVisitors(this.actor, "mafia");

          if (MafiaKill && MafiaKill.length > 1) {
            for (let x = 1; x < MafiaKill.length; x++) {
              visitors.splice(visitors.indexOf(MafiaKill[x]), 1);
            }
          }

          if (visitors?.length) {
            let names = visitors?.map((visitor) => visitor.name);

            if (this.actor.hasEffect("FalseMode")) {
              let players = this.game
                .alivePlayers()
                .filter((p) => p != this.actor);

              for (let v of visitors) {
                players = players.filter((p) => p != v);
              }
              names = [];
              for (let x = 0; x < visitors.length; x++) {
                let randomPlayer = Random.randArrayVal(players).name;
                names.push(randomPlayer);
              }
            }

            this.game.queueAlert(
              `:loud: Someone shouts during the night: ` +
                `Curses! ${names.join(", ")} disturbed my slumber!`
            );
            this.actor.role.data.visitors = [];
          }

          let reports = this.getReports(this.actor);
          for (let report of reports) {
            this.game.queueAlert(
              `:loud: ${addArticle(
                this.actor.getRoleAppearance()
              )} is overheard reading: ${report}`
            );
          }
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Information"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

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
            /*
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
            */
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
