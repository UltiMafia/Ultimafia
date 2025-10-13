const Card = require("../../Card");
const { PRIORITY_VILLAGE } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    if (role.isExtraRole == true) {
      return;
    }

    this.meetings = {
      Village: {
        type: "Village",
        states: ["Day"],
        targets: { include: [canBeVoted], exclude: [cannotBeVoted] },
        flags: ["group", "speech", "voting", "useVotingPower", "Important"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        action: {
          labels: ["kill", "condemn", "hidden"],
          priority: PRIORITY_VILLAGE,
          power: 3,
          run: function () {
            if (this.target == "*magus") {
              this.game.MagusGameDeclared = true;
              let players = this.game.players.filter(
                (p) => p.role.name == "Magus"
              );
              if (players.length <= 0) {
                for (let p of this.game.alivePlayers()) {
                  if (
                    p.role.alignment === "Village" ||
                    p.role.name === "Magus"
                  ) {
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
              return;
            }

            if (this.dominates()) {
              if (
                !this.target.alive &&
                this.target.role.name == "Poltergeist"
              ) {
                this.game.exorcisePlayer(this.target);
              }
              this.target.kill("condemn", this.actor);
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
      "Treasure Chest": {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.game.HaveTreasureChestState == true) {
            for (let player of this.game.players) {
              if (
                this.game
                  .getRoleTags(
                    this.game.formatRoleInternal(
                      player.role.name,
                      player.role.modifier
                    )
                  )
                  .includes("Treasure Chest")
              ) {
                return false;
              }
            }
            return true;
          }
          return true;
        },
      },
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Dusk: {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.alivePlayers()) {
            if (player.hasItem("Ouija Board")) {
              return true;
            }
          }
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
          for (let player of this.game.alivePlayers()) {
            if (player.hasItem("Ouija Board")) {
              return true;
            }
          }
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
      "Give Clue": {
        type: "shouldSkip",
        shouldSkip: function () {
          for (let player of this.game.players) {
            if (player.hasItem("Ouija Board")) {
              return false;
            }
          }
          return true;
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
