const Card = require("../../Card");
const Action = require("../../../../core/Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class FrustratedCondemnation extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
    };

    //this.immunity["condemn"] = 3;
    /*
    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT + 1,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Day" && this.game.getStateName() != "Dusk") return;

          let villageMeeting = this.game.getMeetingByName("Village");

          //New code
          const voteCounts = Object.values(villageMeeting.votes).reduce(
            (acc, vote) => {
              acc[vote] = (acc[vote] || 0) + 1;
              return acc;
            },
            {}
          );

          const minVotes = Math.min(...Object.values(voteCounts));
          const maxVotes = Math.max(...Object.values(voteCounts));

          if (
            voteCounts[this.actor.id] !== minVotes ||
            voteCounts[this.actor.id] === maxVotes ||
            voteCounts[this.actor.id] === 0
          ) {
            return;
          }

          /* Old code in case new causes any problems
          if (villageMeeting.finalTarget === this.actor) {
            return;
          }

          // check if it was a target
          let targeted = false;
          for (let key in villageMeeting.votes) {
            let target = villageMeeting.votes[key];
            if (target === this.actor.id) {
              targeted = true;
              break;
            }
          }
          if (!targeted) {
            return;
          }
          

          let action = new Action({
            actor: this.actor,
            target: this.actor,
            game: this.game,
            labels: ["kill", "frustration", "hidden"],
            power: 3,
            run: function () {
              this.game.sendAlert(
                `${this.target.name} feels immensely frustrated!`
              );
              if (this.dominates()) this.target.kill("basic", this.actor);
            },
          });
          action.do();
        },
      },
    ];
*/

    this.listeners = {
      /*
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_OVERTHROW_VOTE - 3,
          labels: ["hidden", "absolute"],
          run: function () {
            //if (this.game.getStateName() != "Day" && this.game.getStateName() != "Dusk") return;

            let villageMeeting = this.game.getMeetingByName("Village");

            //New code
            const voteCounts = Object.values(villageMeeting.votes).reduce(
              (acc, vote) => {
                acc[vote] = (acc[vote] || 0) + 1;
                return acc;
              },
              {}
            );

            const minVotes = Math.min(...Object.values(voteCounts));
            const maxVotes = Math.max(...Object.values(voteCounts));

            if (
              voteCounts[this.actor.id] !== minVotes ||
              voteCounts[this.actor.id] === maxVotes ||
              voteCounts[this.actor.id] === 0
            ) {
              return;
            }

            /* Old code in case new causes any problems
            if (villageMeeting.finalTarget === this.actor) {
              return;
            }
  
            // check if it was a target
            let targeted = false;
            for (let key in villageMeeting.votes) {
              let target = villageMeeting.votes[key];
              if (target === this.actor.id) {
                targeted = true;
                break;
              }
            }
            if (!targeted) {
              return;
            }
            
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                // Only one village vote can be overthrown
                action.cancel(true);
                break;
              }
            }

            let action = new Action({
              actor: this.actor,
              target: this.actor,
              game: this.game,
              labels: ["kill", "frustration", "hidden"],
              power: 3,
              run: function () {
                this.game.sendAlert(
                  `${this.target.name} feels immensely frustrated!`
                );
                if (this.dominates()) this.target.kill("basic", this.actor);
              },
            });
            action.do();
          },
        });

        this.game.queueAction(action);
      },
      */
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier"])) {
          if (
            this.FrustratedEffect == null ||
            !this.player.effects.includes(this.FrustratedEffect)
          ) {
            this.FrustratedEffect = this.player.giveEffect(
              "Frustrated",
              Infinity
            );
            this.passiveEffects.push(this.FrustratedEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.FrustratedEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.FrustratedEffect != null) {
            this.FrustratedEffect.remove();
            this.FrustratedEffect = null;
          }
        }
      },
    };
  }
};
