const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const {
  PRIORITY_SELF_BLOCK_EARLY,
  PRIORITY_SELF_BLOCK_LATER,
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class BlockIfVisitingSameAlignmentTwice extends Card {
  constructor(role) {
    super(role);

    role.data.AlignmentLastNightVisits = [];

    this.passiveActions = [
      {
        ability: ["Blocking", "Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_SELF_BLOCK_EARLY,
        labels: ["block", "hidden", "absolute"],
        role: role,
        run: function () {
          if (!this.isSelfBlock()) {
            return;
          }
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("absolute")) {
              continue;
            }
            if (action.hasLabel("mafia")) {
              continue;
            }

            let toCheck = action.target;
            if (!Array.isArray(action.target)) {
              toCheck = [action.target];
            }
            if (
              action.actors.indexOf(this.actor) != -1 &&
              action.target &&
              toCheck[0] instanceof Player
            ) {
              for (let y = 0; y < toCheck.length; y++) {
                if (
                  this.role.data.AlignmentLastNightVisits.includes(
                    toCheck[0].getRoleAlignment()
                  )
                ) {
                  if (
                    action.priority > this.priority &&
                    !action.hasLabel("absolute")
                  ) {
                    action.cancelActor(this.actor);
                    break;
                  }
                }
              }
            }
          }
        },
      },
      {
        ability: ["Blocking", "Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_SELF_BLOCK_LATER,
        labels: ["block", "hidden", "absolute"],
        role: role,
        run: function () {
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("absolute")) {
              continue;
            }
            if (action.hasLabel("mafia")) {
              continue;
            }

            let toCheck = action.target;
            if (!Array.isArray(action.target)) {
              toCheck = [action.target];
            }
            if (
              action.actors.indexOf(this.actor) != -1 &&
              action.target &&
              toCheck[0] instanceof Player
            ) {
              for (let y = 0; y < toCheck.length; y++) {
                if (
                  this.role.data.AlignmentLastNightVisits.includes(
                    toCheck[0].getRoleAlignment()
                  )
                ) {
                  if (
                    action.priority > this.priority &&
                    !action.hasLabel("absolute")
                  ) {
                    action.cancelActor(this.actor);
                    break;
                  }
                }
              }
            }
          }
        },
      },
      {
        ability: ["Blocking", "Modifier", "WhenDead"],
        state: "Night",
        actor: null,
        target: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 20,
        labels: ["block", "hidden", "absolute"],
        role: role,
        run: function () {
          let visits = [];
          let actionList = this.game.actions[0];
          for (let action of actionList) {
            let toCheck1 = action.target;
            if (!Array.isArray(action.target)) {
              toCheck1 = [action.target];
            }

            if (
              action.actors.indexOf(this.target) != -1 &&
              !action.hasLabel("hidden") &&
              action.target &&
              toCheck1[0] instanceof Player
            ) {
              visits.push(...toCheck1);
            }
          }

          this.role.data.AlignmentLastNightVisits = visits;
          this.role.data.AlignmentLastNightVisits = visits.map((v) =>
            v.getRoleAlignment()
          );
        },
      },
    ];
  }
};
