const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Dream extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        labels: ["dream", "hidden"],
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          var aliveExceptSelf = this.game.players.filter(
            (p) => p.alive && p != this.actor
          );
          if (aliveExceptSelf.length < 3) return;

          if (this.hasVisitors()) return;

          var dream;
          let evilPlayers = aliveExceptSelf.filter(
            (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
          );
          let village = aliveExceptSelf.filter(
            (p) => p.role.alignment == "Village"
          );

          if (this.actor.hasEffect("FalseMode")) {
            let temp = evilPlayers;
            evilPlayers = village;
            village = temp;
          }

          if (village.length == 0) {
            dream = `:dream: You had a dream that you can trust no one but yourself…`;
          } else if (evilPlayers.length == 0 || Random.randInt(0, 1) == 0) {
            const chosenOne = Random.randArrayVal(village);
            dream = `:dream: You had a dream that you can trust ${chosenOne.name}…`;
          } else {
            // guarantee no repeats in dream
            var chosenThree = [Random.randArrayVal(evilPlayers)];
            aliveExceptSelf = aliveExceptSelf.filter(
              (p) => p !== chosenThree[0]
            );
            aliveExceptSelf = Random.randomizeArray(aliveExceptSelf);
            chosenThree.push(aliveExceptSelf[0]);
            chosenThree.push(aliveExceptSelf[1]);
            chosenThree = Random.randomizeArray(chosenThree);
            dream = `:dream: You had a dream where at least one of ${chosenThree[0].name}, ${chosenThree[1].name}, and ${chosenThree[2].name} is evil…`;
            if (this.actor.hasEffect("FalseMode")) {
              let wrongPlayers = Random.randomizeArray(evilPlayers);
              dream = `:dream: You had a dream where at least one of ${wrongPlayers[0].name}, ${wrongPlayers[1].name}, and ${wrongPlayers[2].name} is evil…`;
            }
          }

          this.actor.queueAlert(dream);
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
          labels: ["dream", "hidden", "investigate"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          run: function () {
            var aliveExceptSelf = this.game.players.filter(
              (p) => p.alive && p != this.actor
            );
            if (aliveExceptSelf.length < 3) return;

            if (this.hasVisitors()) return;

            let infoEvil = this.game.createInformation(
              "ThreePlayersOneEvilInfo",
              this.actor,
              this.game,
              this.actor
            );
            let infoGood = this.game.createInformation(
              "GoodPlayerInfo",
              this.actor,
              this.game,
              this.actor
            );
            infoEvil.processInfo();
            infoGood.processInfo();
            var alert;
            if (infoGood.mainInfo == "No Good Players Exist") {
              infoGood.getInfoRaw();
              alert = `:dream: You had a dream that you can trust no one but yourself…`;
            } else if (
              infoEvil.mainInfo == "No Evil Players Exist" ||
              Random.randInt(0, 1) == 0
            ) {
              alert = `:dream: You had a dream that you can trust ${
                infoGood.getInfoRaw().name
              }…`;
            } else {
              let evilNames = infoEvil.getInfoRaw();
              alert = `:dream: You had a dream where at least one of ${evilNames[0].name}, ${evilNames[1].name}, and ${evilNames[2].name} is evil…`;
            }

            this.actor.queueAlert(alert);
            /*
            var dream;
            let evilPlayers = aliveExceptSelf.filter(
              (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
            );
            let village = aliveExceptSelf.filter(
              (p) => p.role.alignment == "Village"
            );

            if (this.actor.hasEffect("FalseMode")) {
              let temp = evilPlayers;
              evilPlayers = village;
              village = temp;
            }

            if (village.length == 0) {
              dream = `:dream: You had a dream that you can trust no one but yourself…`;
            } else if (evilPlayers.length == 0 || Random.randInt(0, 1) == 0) {
              const chosenOne = Random.randArrayVal(village);
              dream = `:dream: You had a dream that you can trust ${chosenOne.name}…`;
            } else {
              // guarantee no repeats in dream
              var chosenThree = [Random.randArrayVal(evilPlayers)];
              aliveExceptSelf = aliveExceptSelf.filter(
                (p) => p !== chosenThree[0]
              );
              aliveExceptSelf = Random.randomizeArray(aliveExceptSelf);
              chosenThree.push(aliveExceptSelf[0]);
              chosenThree.push(aliveExceptSelf[1]);
              chosenThree = Random.randomizeArray(chosenThree);
              dream = `:dream: You had a dream where at least one of ${chosenThree[0].name}, ${chosenThree[1].name}, and ${chosenThree[2].name} is evil…`;
              if (this.actor.hasEffect("FalseMode")) {
                let wrongPlayers = Random.randomizeArray(evilPlayers);
                dream = `:dream: You had a dream where at least one of ${wrongPlayers[0].name}, ${wrongPlayers[1].name}, and ${wrongPlayers[2].name} is evil…`;
              }
            }

            this.actor.queueAlert(dream);
            */
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
