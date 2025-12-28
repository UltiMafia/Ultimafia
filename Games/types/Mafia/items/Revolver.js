const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Revolver extends Item {
  constructor(options, Dragoon, Chamber) {
    super("Revolver");

    this.magicCult = options?.magicCult;
    this.Dragoon = Dragoon;
    this.Chamber = 1;
    this.LoadedChamber = Chamber || 1;

    this.baseMeetingName = "Revolver";
    this.currentMeetingIndex = 0;

    this.meetings = {
      [this.baseMeetingName]: {
        actionName: "Revolver",
        states: ["Day"],
        flags: ["voting", "instant", "hideAfterVote", "mustAct", "Important"],
        inputType: "custom",
        targets: ["Shoot", "Spin and Shoot"],
        item: this,
        action: {
          labels: ["kill"],
          item: this,
          run: function () {
            this.item.drop();
            if (this.target == "Spin and Shoot") {
              this.item.Chamber = Random.randInt(1, 6);
            }
            if (this.item.Chamber == this.item.LoadedChamber) {
              this.game.broadcast("gunshot");
              var magicBullet = this.item.magicCult;
              this.game.queueAlert(
                `:gun: ${this.actor.name} fires the Revolver!`
              );
              if (magicBullet && this.actor.getRoleAlignment() !== "Cult") {
                let action = new Action({
                  actor: this.actor,
                  target: this.actor,
                  game: this.game,
                  labels: ["convert", "hidden"],
                  run: function () {
                    if (this.dominates()) this.target.setRole("Cultist");
                  },
                });
                action.do();
              } else if (this.actor == this.item.Dragoon) {
                this.actor.role.revealToAll();
              } else {
                if (this.dominates(this.actor)) {
                  if (this.item.Dragoon) {
                    this.item.Dragoon.role.timebombKills++;
                  }
                  this.actor.kill("gun", this.actor, true);
                }
              }
              return;
            } else {
              this.game.queueAlert(
                `:gun: ${this.actor.name} fires the Revolver and the chamber was empty!`
              );
            }
            this.item.Chamber++;
            if (this.item.Chamber > 6) {
              this.item.Chamber = 1;
            }
            let players = this.game
              .alivePlayers()
              .filter((p) => p.role.name != "Host");
            if (this.actor.role.name == "Host") {
              players = this.game.alivePlayers();
            }
            let index = players.indexOf(this.actor);
            let rightIdx = (index + 1) % players.length;
            //this.game.broadcast("gunshot");
            this.item.hold(players[rightIdx]);
            this.game.queueAlert(
              `:gun2: ${this.actor.name} passes the Revolver to ${players[rightIdx].name}…`
            );
            this.item.incrementMeetingName();
            this.game.instantMeeting(this.item.meetings, [players[rightIdx]]);
          },
        },
      },
    };
  }

  get snoopName() {
    if (this.magicCult) {
      return "Revolver (Gremlin)";
    }

    return this.name;
  }

  getMeetingName(idx) {
    return `${this.id} ${idx}`;
  }

  getCurrentMeetingName() {
    if (this.currentMeetingIndex === 0) {
      return this.baseMeetingName;
    }

    return this.getMeetingName(this.currentMeetingIndex);
  }

  // increase meeting name index to ensure each meeting name is unique
  incrementMeetingName() {
    let mtg = this.meetings[this.getCurrentMeetingName()];
    delete this.meetings[this.getCurrentMeetingName()];
    this.currentMeetingIndex += 1;
    this.meetings[this.getCurrentMeetingName()] = mtg;
  }
};
