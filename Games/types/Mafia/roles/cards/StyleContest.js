const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_EFFECT_GIVER_EARLY,
} = require("../../const/Priority");

module.exports = class StyleContest extends Card {
  constructor(role) {
    super(role);

    role.AllTasksComplete = false;
    let targets = [
      "Make all info false tonight",
      "Gain an extra mafia role ability",
    ];
    let roles = role.getAllRoles();
    roles = roles.map((r) => r.split(":")[0]);
    if (roles.includes("Butterfly") && role.canDoSpecialInteractions()) {
      targets.push("Revive all dead players as random independent roles");
    }
/*
    this.meetings = {
      "Prize Time": {
        actionName: "Choose Reward",
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: targets,
        shouldMeet: function () {
          return this.AllTasksComplete;
        },
        action: {
          labels: ["Special"],
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          role: this.role,
          run: function () {
            if (this.target == "Make all info false tonight") {
              for (let player of this.game.players) {
                player.giveEffect("FalseMode", 1);
              }
            } else if (this.target == "Gain an extra mafia role ability") {
              const randomMafiaRole = Random.randArrayVal(
                this.role
                  .getAllRoles()
                  .filter((r) => this.game.getRoleAlignment(r) == "Mafia")
              );
              for (let player of this.game.players) {
                if (player.faction == this.actor.faction) {
                  let role = player.addExtraRole(randomMafiaRole);
                  player.passiveExtraRoles.push(role);
                  player.queueAlert(
                    `${this.role.name} has granted you ${this.game.formatRole(
                      randomMafiaRole
                    )}'s abilites!`
                  );
                }
              }
              //let role = this.actor.addExtraRole(randomMafiaRole);
              //this.GainedRoles.push(role);
            } else if (
              this.target ==
              "Revive all dead players as random independent roles"
            ) {
              let convert = new Action({
                actor: this.actor,
                game: this.actor.game,
                labels: ["convert", "revive", "hidden"],
                role: this.role,
                run: function () {},
              });
              for (let player of this.game.players) {
                if (!player.alive && convert.dominates(player)) {
                  let indieRoles = this.role
                    .getAllRoles()
                    .filter(
                      (r) => this.game.getRoleAlignment(r) == "Independent"
                    );
                  if (indieRoles.length <= 0) {
                    indieRoles = ["Survivor", "Fool", "Hitchhiker", "Nomad"];
                  }
                  const randomThirdRole = Random.randArrayVal(indieRoles);

                  player.setRole(randomThirdRole, null, false, false, false);
                  player.revive("basic", this.actor);
                }
              }
            }
            this.role.AllTasksComplete = false;
          },
        },
      },
    };
    */

    this.passiveActions = [
      {
        ability: ["Item"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["role", "hidden"],
        run: function () {
              this.role.AllTasksComplete = false;
              let teammates = this.game.players.filter(
                (p) => p.faction == this.actor.faction
              );
              for (let player of teammates) {
                let subaction = new Action({
                actor: this.actor,
                game: this.actor.game,
                target: teammate,
                labels: ["role", "hidden"],
                role: this.role,
                run: function () {
                 this.target.holdItem("Coffee");
                this.target.queueGetItemAlert("Coffee");
                },
              });
                if (player.alive) {
                  let effect = player.giveEffect(
                    "DayTask",
                    this.role,
                    player,
                    subaction,
                    null,
                    5
                  );
                  player.queueAlert(
                    `${
                      this.role.name
                    } has ordered you to ${effect.getTaskMessage()} Complete this task for Coffee!`
                  );
                }
              }
            },
      },
    ];
    
  }
};
