const Random = require("../../../../lib/Random");
const Item = require("../Item");

module.exports = class Leader extends Item {
  constructor(game, hostageIds) {
    super("Leader");

    this.listeners = {
      meetingsMade() {
        this.holder.sendAlert(
          `Choose ${this.game.currentSwapAmt} hostage${
            this.game.currentSwapAmt > 1 ? "s" : ""
          } to swap.`
        );
      },
    };
    this.meetings = {
      Leaders: {
        states: ["Hostage Swap"],
        flags: ["group", "speech"],
      },
      "Hostage Swap": {
        states: ["Hostage Swap"],
        flags: ["voting", "multi", "mustAct"],
        targets: { include: hostageIds, exclude: ["members"] },
        multiMin: game.currentSwapAmt,
        multiMax: game.currentSwapAmt,
        action: {
          run() {
            const fromRoom = this.actor.room;
            const toRoom = fromRoom == 1 ? 2 : 1;

            for (const player of this.target) {
              this.game.rooms[`Room ${toRoom}`].push(player);
              player.putInRoom(toRoom);
            }

            this.game.rooms[`Room ${fromRoom}`] = this.game.rooms[
              `Room ${fromRoom}`
            ].filter((player) => player.room != toRoom);

            this.actor.dropItem("Leader");
          },
        },
      },
    };
  }
};
