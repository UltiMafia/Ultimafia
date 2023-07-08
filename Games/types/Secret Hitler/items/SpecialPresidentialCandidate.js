const Item = require("../Item");

module.exports = class SpecialPresidentialCandidate extends Item {
  constructor() {
    super("Special Presidential Candidate");

    this.meetings = {
        "Nominate Chancellor": {
          states: ["Nomination"],
          flags: ["voting"],
          targets: { include: ["alive"], exclude: ["self", isPrevGovernment] },
          action: {
            labels: ["hidden"],
            run: function () {
              this.actor.role.data.chancellorNominee = this.target;
              this.game.queueAlert(`${this.actor.role.data.chancellorNominee.name} has been selected as the candidate for Chancellorship.`);
              for (let player of this.game.players) {
                player.holdItem("Special Election Vote", {chancellorNominee: this.actor.role.data.chancellorNominee, presidentNominee: this.actor});
              }
              this.item.drop();
              delete this.actor.role.data.chancellorNominee;
            },
          },
        },
      };
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is nominating a candidate for Chancellorship…`);
  }
};

function isPrevGovernment(player) {
  if (this.game.currentPlayerList.length > 5) {
    return this.role && player == this.game.electedPresident || this.role && player == this.game.electedChancellor;
  } else {
    return this.role && player == this.game.electedChancellor;
  }
}