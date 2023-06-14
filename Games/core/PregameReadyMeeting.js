const Meeting = require("./Meeting");

module.exports = class PregameReadyMeeting extends Meeting {
  constructor(game) {
    super(game, "Pregame Ready");

    this.group = true;
    this.voting = true;
    this.noRecord = true;
    this.noVeg = true;

    this.inputType = "button";
    this.targets = ["Ready"];
  }

  getMeetingInfo(player) {
    const playerId = player && player.id;

    if (!playerId) return;

    const member = this.members[playerId];
    const members = [{ id: member.id, canUpdateVote: true, canVote: true }];

    return {
      id: this.id,
      name: this.name,
      actionName: this.name,
      members,
      group: this.group,
      speech: this.speech,
      voting: this.voting,
      targets: this.targets,
      inputType: this.inputType,
      votes: this.votes,
      voteRecord: [],
      messages: [],
      canUpdateVote: true,
      canUnvote: false,
      canVote: true,
      amMember: true,
    };
  }

  vote(voter) {
    if (this.finished || this.members[voter.id].ready) return;

    this.members[voter.id].ready = true;
    this.votes[voter.id] = "Ready";
    this.members[voter.id].player.seeVote(
      { voter, target: "Ready", meeting: this },
      true
    );

    for (const member of this.members)
      member.player.sendAlert(`${voter.name} is ready.`);

    this.checkAllPlayersReady();
  }

  checkAllPlayersReady() {
    for (const member of this.members) if (!member.ready) return;

    this.finished = true;
    this.game.startPregameCountdown();
    this.game.sendAlert("Everyone is ready, starting the game!");
  }

  checkReady() {}

  finish() {}
};
