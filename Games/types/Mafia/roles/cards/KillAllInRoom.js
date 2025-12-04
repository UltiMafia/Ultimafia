const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillAllInRoom extends Card {
  constructor(role) {
    super(role);

    
    this.passiveActions = [
      {
        ability: ["Kill", "OnlyWhenAlive"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
              if (!this.actor.alive) return;
              if (this.game.FinalRound < this.game.CurrentRound) {
                for (let people of this.game.players) {
                  if (
                    people.role.data.RoleTargetBackup == "President" ||
                    people.role.data.RoleTargetBackup == "Assassin"
                  ) {
                    people.role.data.RoleTargetBackup = null;
                  }
                }
                for (let room of this.game.Rooms) {
                  if (room.members.includes(this.actor)) {
                    for (let member of room.members) {
                      if (member != this.actor && this.dominates(member)) {
                        member.kill("basic", this.actor);
                      }
                    }
                  }
                }
                for (let player of this.game.players) {
                  for (let item of player.items) {
                    if (item.name == "Room") {
                      item.drop();
                    }
                    if (item.name == "NoVillageMeeting") {
                      item.drop();
                    }
                  }
                }

                this.actor.kill("basic", this.actor);
              }
            },
      },
    ];

  }
};
