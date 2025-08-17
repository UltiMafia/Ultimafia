const Item = require("../Item");
const Random = require("../../../../lib/Random");
const Player = require("../Player");
const Action = require("../Action");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_NIGHT_ROLE_BLOCKER,
} = require("../const/Priority");

module.exports = class Coffee extends Item {
  constructor(options) {
    super("Coffee");

    this.magicCult = options?.magicCult;
    this.broken = options?.broken;

    this.meetings = {
      "Coffee Actions": {
        states: ["Night"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        item: this,
        action: {
          labels: ["hidden", "absolute"],
          item: this,
          run: function () {
            if (this.target != "Yes") return;
            this.item.drop();
            let effect = this.actor.giveEffect(
              "ExtraRoleEffect",
              this.game.formatRoleInternal(
                this.actor.role.name,
                this.actor.role.modifier
              ),
              1
            );
            this.actor.joinMeetings(effect.ExtraRole.meetings);
            for (let meeting of this.game.meetings) {
              meeting.generateTargets();
            }
            this.actor.sendMeetings();

            /*
            let actions = [];
            for (let action of this.game.actions[0]) {
              if (
                action.actor == this.actor &&
                action.target instanceof Player &&
                action.target != this.actor &&
                !action.hasLabels(["kill", "mafia"])
              ) {
                actions.push(action);
              }
            }
            if (!this.item.magicCult) {
              for (let visit of actions) {
                var actionCopy = new Action({
                  actor: visit.actor,
                  target: this.target,
                  game: visit.game,
                  meeting: visit.meeting,
                  priority: visit.priority,
                  labels: visit.labels,
                  run: visit.unboundRun,
                  power: visit.power,
                  item: visit.item,
                  effect: visit.effect,
                  delay: visit.delay,
                });
                this.game.queueAction(actionCopy);
              }
            } else {
              var actionCopy = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                priority: PRIORITY_CONVERT_DEFAULT,
                labels: ["convert", "cultist"],
                run: function () {
                  if (this.dominates())
                    this.target.setRole(
                      "Cultist",
                      null,
                      false,
                      false,
                      false,
                      "Cult"
                    );
                },
                item: this.item,
              });
              this.game.queueAction(actionCopy);
            }
            if (this.item.broken) {
              var actionCopy2 = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                priority: PRIORITY_CONVERT_DEFAULT,
                labels: ["block", "hidden"],
                run: function () {
                  if (this.dominates()) {
                    this.blockActions(this.actor);
                  }
                },
                item: this.item,
              });
              this.game.queueAction(actionCopy2);
            }
            */
          },
        },
      },
    };
  }
};
