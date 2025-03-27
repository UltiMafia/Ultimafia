const Card = require("../../Card");
const { PRIORITY_VILLAGE } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        type: "Village",
        states: ["Day"],
        targets: { include: [canBeVoted], exclude: [cannotBeVoted] },
        flags: ["group", "speech", "voting", "useVotingPower"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        action: {
          labels: ["kill", "condemn", "hidden"],
          priority: PRIORITY_VILLAGE,
          power: 3,
          run: function () {
            if (this.dominates()) {
              if (!this.target.alive) {
                this.game.exorcisePlayer(this.target);
              }
              this.target.kill("condemn", this.actor);
            }
          },
        },
      },
      "Magus Game": {
        states: ["Day"],
        inputType: "custom",
        targets: ["Declare Magus Game", "No"],
        flags: ["group", "voting", "useVotingPower"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        shouldMeet: function () {
          return this.game.MagusPossible == true;
        },
        action: {
          labels: ["hidden", "magus"],
          priority: PRIORITY_VILLAGE - 1,
          power: 3,
          run: function () {
            if (this.target != "Declare Magus Game") return;

            let players = this.game.players.filter(
              (p) =>
                (p.role.alignment == "Mafia" || p.role.alignment == "Cult") &&
                p.role.name != "Magus"
            );
            if (players.length > 0) {
              for (let p of this.game.alivePlayers()) {
                if (p.role.alignment === "Village" || p.role.name === "Magus") {
                  p.kill("basic", this.actor, true);
                }
              }
            } else {
              for (let p of this.game.players) {
                if (p.role.alignment == "Village" || p.role.name == "Magus") {
                  p.role.data.MagusWin = true;
                }
              }
            }
          },
        },
      },
      Graveyard: {
        states: ["Night"],
        flags: ["group", "speech", "liveJoin"],
        whileAlive: false,
        whileDead: true,
        passiveDead: false,
        speakDead: true,
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Dusk/) || stateInfo.name.match(/Dawn/)) {
          this.game.HaveDuskOrDawn = false;
        }
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        if (!this.game.MagusPossible) return;

        //this.meetings["Village"].targets.push("Proclaim Magus Game");
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Dusk: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.players) {
            //this.game.sendAlert(`Stuff Village ${player.role.name}: ${player.role.modifier}: `);
            if (
              this.game
                .getRoleTags(
                  this.game.formatRoleInternal(
                    player.role.name,
                    player.role.modifier
                  )
                )
                .includes("Dusk")
            ) {
              return false;
            }
          }
          return true;
        },
      },
      Night: {
        type: "delayActions",
        delayActions: true,
      },
      Dawn: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.players) {
            if (
              this.game
                .getRoleTags(
                  this.game.formatRoleInternal(
                    player.role.name,
                    player.role.modifier
                  )
                )
                .includes("Dawn")
            ) {
              return false;
            }
          }
          return true;
          /*
          if (this.game.HaveDuskOrDawn != true) {
            return true;
          }
          return false;
          */
        },
      },
    };
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
function canBeVoted(player) {
  return (
    player.alive ||
    (!player.alive && !player.exorcised && player.game.ExorciseVillageMeeting)
  );
}
