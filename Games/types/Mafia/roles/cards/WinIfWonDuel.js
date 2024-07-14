module.exports = class WinByGuessingKira extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (winners) {
        if (this.againOnFinished && this.actor.name === this.actor.winner) {
          winners.addPlayer(this.player, this.player.role.name);
        }
      },
    };
  }
};
