const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_ROOM_SWAP,
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class ForceSplitDecision extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player !== player) {
          return;
        }
        if (this.game.Rooms.length > 0) {
          return;
        }
        if (!this.hasAbility(["OnlyWhenAlive"])) {
          return;
        }
        this.game.FinalRound =
          3 + this.modifier.split("/").filter((m) => m == "Delayed").length;
        let RoomCount;
        if (this.modifier) {
          RoomCount =
            2 + this.modifier.split("/").filter((m) => m == "X-Shot").length;
        } else {
          RoomCount = 2;
        }
        let playerCount = this.game.players.filter(
          (p) => p.role.name != "Host"
        ).length;
        let playersPerRoom = Math.floor(playerCount / RoomCount);
        let extraPlayers = playerCount % RoomCount;
        let rooms = [];
        let playersRandom = Random.randomizeArray(
          this.game.players.filter((p) => p.role.name != "Host")
        );
        for (let x = 0; x < RoomCount; x++) {
          let room = {
            name: "Room " + (x + 1),
            members: [],
            leader: null,
            number: x + 1,
            game: this.game,
          };
          for (let y = 0; y < playersPerRoom; y++) {
            room.members.push(playersRandom.pop());
          }
          this.game.Rooms.push(room);
        }
        let index = 0;
        while (playersRandom.length > 0) {
          this.game.Rooms[index].members.push(playersRandom.pop());
          index++;
        }

        for (let Room of this.game.Rooms) {
          for (let member of Room.members) {
            member.holdItem("Room", Room);
          }
        }

        for (let player of this.game.players) {
          player.holdItem("NoVillageMeeting");
        }
        this.game.CurrentRound = 1;
        let hosts = this.game
          .alivePlayers()
          .filter((p) => p.role.name == "Host");
        for (let host of hosts) {
          for (let room of this.game.Rooms) {
            let item = host.holdItem("Room", room);
            host.giveEffect("CannotVote", 1, room.name);
            item.meetings[room.name].canVote = false;
          }
          host.giveEffect("CannotBeVoted", 1);
        }
      },
      state: function (stateInfo) {
        var villageBlock = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 100,
          labels: ["absolute", "hidden"],
          run: function () {
            if (!this.actor.alive) {
              return;
            }
            if (!this.actor.hasEffect("AssassinEffect")) {
              return;
            }
            if (this.game.Rooms.length > 0) {
              for (let player of this.game.players) {
                player.holdItem("NoVillageMeeting");
              }
            }
            let hosts = this.game
              .alivePlayers()
              .filter((p) => p.role.name == "Host");
            for (let host of hosts) {
              host.giveEffect("CannotBeVoted", 1);
            }
          },
        });
        this.game.queueAction(villageBlock);

        if (stateInfo.name.match(/Day/)) {
          var action = new Action({
            actor: this.player,
            game: this.player.game,
            priority: PRIORITY_ROOM_SWAP + 5,
            labels: ["absolute", "hidden"],
            run: function () {
              if (!this.actor.alive) {
                return;
              }
              if (!this.actor.hasEffect("AssassinEffect")) {
                return;
              }
              let playerCount = this.game.alivePlayers().length;
              if (
                playerCount <= 10 ||
                (this.game.CurrentRound > this.game.FinalRound - 3 &&
                  playerCount <= 13) ||
                (this.game.CurrentRound > this.game.FinalRound - 2 &&
                  playerCount <= 21) ||
                (this.game.CurrentRound > this.game.FinalRound - 1 &&
                  playerCount > 21)
              ) {
                this.game.currentSwapAmt = 1;
              } else if (
                playerCount <= 13 ||
                (this.game.CurrentRound > this.game.FinalRound - 4 &&
                  playerCount <= 17) ||
                (this.game.CurrentRound > this.game.FinalRound - 3 &&
                  playerCount <= 21) ||
                (this.game.CurrentRound > this.game.FinalRound - 2 &&
                  playerCount > 21) ||
                this.game.Rooms.length > 2
              ) {
                this.game.currentSwapAmt = 2;
              } else if (
                playerCount <= 17 ||
                (this.game.CurrentRound > this.game.FinalRound - 4 &&
                  playerCount <= 21) ||
                (this.game.CurrentRound > this.game.FinalRound - 3 &&
                  playerCount > 21)
              ) {
                this.game.currentSwapAmt = 3;
              } else if (
                playerCount <= 21 ||
                (this.game.CurrentRound > this.game.FinalRound - 4 &&
                  playerCount > 21)
              ) {
                this.game.currentSwapAmt = 4;
              } else {
                this.game.currentSwapAmt = 5;
              }
              for (let Room of this.game.Rooms) {
                if (Room.leader == null || !Room.leader) {
                  Room.leader = Random.randArrayVal(Room.members);
                  this.game.events.emit(
                    "ElectedRoomLeader",
                    Room.leader,
                    Room.number,
                    false
                  );
                }

                Room.leader.holdItem("RoomLeader", this.game, Room);
                this.game.queueAlert(
                  `${Room.leader.name} is ${Room.name}'s Leader this round!`
                );
              }
            },
          });
          this.game.queueAction(action);
        } else if (stateInfo.name.match(/Night/)) {
          var action = new Action({
            actor: this.player,
            game: this.player.game,
            priority: PRIORITY_ROOM_SWAP + 5,
            labels: ["absolute", "hidden"],
            run: function () {
              if (!this.actor.alive) {
                return;
              }
              if (!this.actor.hasEffect("AssassinEffect")) {
                return;
              }
              for (let Room of this.game.Rooms) {
                if (Room.leader == null) {
                  this.game.queueAlert(
                    `Round ${this.game.CurrentRound}! Elect a Leader`
                  );
                  return;
                }
              }
              for (let player of this.game.players) {
                for (let item of player.items) {
                  if (item.name == "Room") {
                    item.drop();
                  }
                }
              }

              for (let Room of this.game.Rooms) {
                for (let member of Room.members) {
                  member.holdItem("Room", Room);
                }
                let hosts = this.game
                  .alivePlayers()
                  .filter((p) => p.role.name == "Host");
                for (let host of hosts) {
                  for (let room of this.game.Rooms) {
                    let item = host.holdItem("Room", room);
                    host.giveEffect("CannotVote", 1, room.name);
                    item.meetings[room.name].canVote = false;
                  }
                  host.giveEffect("CannotBeVoted", 1);
                }
              }
              this.game.statesSinceLastDeath = 0;
              this.game.CurrentRound = this.game.CurrentRound + 1;
              this.game.queueAlert(
                `Round ${this.game.CurrentRound}! Elect a Leader`
              );
            },
          });
          this.game.queueAction(action);
        }
      },
      AbilityToggle: function (player) {
        if (!this.player.alive) {
          return;
        }
        let checks = true;
        for (let player of this.game.alivePlayers()) {
          for (let effect of player.effects) {
            if (effect.name == "BackUp") {
              if (
                effect.BackupRole &&
                `${effect.BackupRole}` === `${this.name}` &&
                effect.CurrentRole.hasAbility([
                  "Convert",
                  "OnlyWhenAlive",
                  "Modifier",
                ])
              ) {
                checks = false;
              }
            }
          }
        }
        if (this.game.FinalRound < this.game.CurrentRound) {
          checks = true;
        }
        if (!this.hasAbility(["WhenDead"])) {
          checks = false;
        }

        if (checks == true) {
          if (
            this.AssassinEffect == null ||
            !this.player.effects.includes(this.AssassinEffect)
          ) {
            this.AssassinEffect = this.player.giveEffect(
              "AssassinEffect",
              Infinity
            );
            this.passiveEffects.push(this.AssassinEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.AssassinEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.AssassinEffect != null) {
            this.AssassinEffect.remove();
            this.AssassinEffect = null;
          }
        }
      },
    };
  }
};
