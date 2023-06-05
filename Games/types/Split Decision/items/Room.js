const Item = require("../Item");

module.exports = class Room extends Item {
  constructor(roomNum) {
    super("Room");

    this.roomNum = roomNum;
    this.meetings = {
      [`Room ${roomNum}`]: {
        actionName: "Choose Leader",
        states: ["Round"],
        flags: ["group", "speech", "voting", "mustAct"],
        targets: { include: ["members"], exclude: [] },
        action: {
          item: this,
          run: function () {
            this.target.holdItem(
              "Leader",
              this.game,
              this.meeting.members.map((m) => m.id)
            );
          },
        },
      },
      [`Private Reveal ${roomNum}`]: {
        actionName: "Private Role Reveal",
        states: ["Round"],
        flags: ["voting", "repeatable", "ready", "noRecord"],
        targets: {
          include: [`itemProp:Room:roomNum:${roomNum}`],
          exclude: ["members"],
        },
        action: {
          item: this,
          run: function () {
            this.target.sendAlert(
              `${this.actor.name} shows you their role: ${this.actor.role.name}`
            );
            this.actor.sendAlert(
              `You showed your role to ${this.target.name}.`
            );
          },
        },
      },
      [`Public Reveal ${roomNum}`]: {
        actionName: "Public Role Reveal",
        states: ["Round"],
        flags: ["voting", "instant", "ready", "noRecord"],
        inputType: "boolean",
        action: {
          item: this,
          run: function () {
            if (this.target == "Yes") {
              var meeting = this.game.getMeetingByName(`Room ${roomNum}`);
              meeting.sendAlert(
                `${this.actor.name} shows their role to everyone: ${this.actor.role.name}`
              );
            }
          },
        },
      },
    };
  }
};
