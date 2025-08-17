const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class HostActions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Do Host Action": {
        actionName: "Host Actions",
        states: ["Day"],
        flags: [
          "voting",
          "instant",
          "instantButChangeable",
          "repeatable",
          "noVeg",
        ],
        inputType: "custom",
        targets: [
          "Nothing",
          "Grant Poll Vote Immunity",
          "Run Poll",
          "Reveal Poll Results",
          "Gain Gun",
        ],
        action: {
          run: function () {
            if (this.actor.role.data.Count == null) {
              this.actor.role.data.Count = 0;
            }
            this.actor.role.data.Count += 1;
            if (this.target === "Run Poll") {
              this.actor.role.data.PollVotes = [];
              this.game.queueAlert("The Host has decided to Do a Poll");
              for (const player of this.game.alivePlayers()) {
                if (player != this.actor) {
                  let ShareWith = player.holdItem(
                    "HostPlayerPoll",
                    this.actor,
                    player,
                    this.actor.role.data.Count
                  );
                  this.game.instantMeeting(ShareWith.meetings, [player]);
                }
              }
            } else if (this.target === "Grant Poll Vote Immunity") {
              let temp = this.actor.holdItem(
                "HostGrantImmuity",
                this.actor.role.data.Count
              );
              this.game.instantMeeting(temp.meetings, [this.actor]);
            } else if (this.target === "Gain Gun") {
              let gun = this.actor.holdItem("Gun");
              for (let x = 0; x < this.actor.role.data.Count; x++) {
                gun.incrementMeetingName();
              }
              this.game.instantMeeting(gun.meetings, [this.actor]);
            } else if (this.target === "Reveal Poll Results") {
              if (
                this.actor.role.data.PollVotes == null ||
                this.actor.role.data.PollVotes.length <= 0
              ) {
                this.actor.queueAlert("Their are no votes.");
              } else {
                let players = [];
                let counts = [];
                for (let vote of this.actor.role.data.PollVotes) {
                  if (players.includes(vote)) {
                    counts[players.indexOf(vote)] += 1;
                  } else {
                    players.push(vote);
                    counts.push(1);
                  }
                }
                let max = 0;
                let maxPlayers = [];
                for (let player of players) {
                  if (counts[players.indexOf(player)] > max) {
                    max = counts[players.indexOf(player)];
                    maxPlayers = [player];
                  } else if (counts[players.indexOf(player)] == max) {
                    maxPlayers.push(player);
                  }
                }

                this.game.queueAlert(
                  `${maxPlayers.map(
                    (p) => p.name
                  )} has received the most Votes with ${max}.`
                );
              }
            }
          },
        },
      },
    };
  }
};
