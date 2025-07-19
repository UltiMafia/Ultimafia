const Card = require("../../Card");
//const Action = require("../../../../core/Action");
const Action = require("../../Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CountEvilVotes extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT + 1,
        labels: ["hidden", "absolute"],
        run: function () {
          if (
            this.game.getStateName() != "Day" &&
            this.game.getStateName() != "Dusk"
          )
            return;

          let villageMeeting = this.game.getMeetingByName("Village");
          if (this.game.RoomOne.includes(this.actor)) {
            villageMeeting = this.game.getMeetingByName("Room 1");
          } else if (this.game.RoomTwo.includes(this.actor)) {
            villageMeeting = this.game.getMeetingByName("Room 2");
          }
          if (!villageMeeting) return;
          //New code
          const voteCounts = Object.values(villageMeeting.votes).reduce(
            (acc, vote) => {
              acc[vote] = (acc[vote] || 0) + 1;
              return acc;
            },
            {}
          );

          const minVotes = Math.min(...Object.values(voteCounts));
          const maxVotes = Math.max(...Object.values(voteCounts));
          let villageVotes = this.actor.role.data.VotingLog;
          this.actor.role.data.evilVoted = false;
          let maxTarget;
          let tied = false;
          //this.actor.queueAlert(`${maxVotes}`);

          for (let x = 0; x < villageVotes.length; x++) {
            if (
              this.game.getRoleAlignment(
                villageVotes[x].voter.getRoleAppearance().split(" (")[0]
              ) == "Cult" ||
              this.game.getRoleAlignment(
                villageVotes[x].voter.getRoleAppearance().split(" (")[0]
              ) == "Mafia"
            ) {
              if (voteCounts[villageVotes[x].target] == maxVotes) {
                if (maxTarget == null) {
                  maxTarget = villageVotes[x].target;
                } else if (villageVotes[x].target != maxTarget) {
                  tied = true;
                }
                this.actor.role.data.evilVoted = true;
                this.actor.role.data.voteTied = tied;
              }
            }
          }
        },
      },
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (
            this.game.getStateName() != "Night" &&
            this.game.getStateName() != "Dawn"
          )
            return;

          let outcome = "No";
          var alert;

          if (this.actor.role.data.voteTied == true) {
            alert = `:invest: Their was no Majority Vote yesterday!`;
            this.actor.queueAlert(alert);
            return;
          }

          if (this.actor.role.data.VotingLog.length <= 0) return;
          if (this.actor.hasEffect("FalseMode")) {
            if (this.actor.role.data.evilVoted) {
              this.actor.role.data.evilVoted = false;
            } else {
              this.actor.role.data.evilVoted = true;
            }
          }

          if (this.actor.role.data.evilVoted == true) {
            alert = `:invest: You learn that Evil Players voted with the Majority yesterday!`;
          } else {
            alert = `:invest: You learn that no evil players voted with the Majority yesterday!`;
          }

          if (this.game.RoomOne.length > 0 && this.game.RoomTwo.length > 0) {
            if (this.actor.role.data.evilVoted == true) {
              alert = `:invest: You learn that Evil Players voted with the Majority in the Room you were in yesterday!`;
            } else {
              alert = `:invest: You learn that no evil players voted with the Majority in the Room you were in yesterday!`;
            }
          }

          this.actor.queueAlert(alert);
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) return;

        if (stateInfo.name.match(/Day/)) {
          this.data.VotingLog = [];

          var action = new Action({
            actor: this.player,
            game: this.player.game,
            role: this,
            priority: PRIORITY_DAY_DEFAULT + 1,
            labels: ["hidden", "absolute"],
            run: function () {
              let villageMeeting = this.game.getMeetingByName("Village");
              if (this.game.RoomOne.includes(this.actor)) {
                villageMeeting = this.game.getMeetingByName("Room 1");
              } else if (this.game.RoomTwo.includes(this.actor)) {
                villageMeeting = this.game.getMeetingByName("Room 2");
              }
              if (!villageMeeting) return;
              //New code
              const voteCounts = Object.values(villageMeeting.votes).reduce(
                (acc, vote) => {
                  acc[vote] = (acc[vote] || 0) + 1;
                  return acc;
                },
                {}
              );

              const minVotes = Math.min(...Object.values(voteCounts));
              const maxVotes = Math.max(...Object.values(voteCounts));
              let villageVotes = this.role.data.VotingLog;
              this.role.data.evilVoted = false;
              let maxTarget;
              let tied = false;
              //this.actor.queueAlert(`${maxVotes}`);

              for (let x = 0; x < villageVotes.length; x++) {
                if (
                  this.game.getRoleAlignment(
                    villageVotes[x].voter.getRoleAppearance().split(" (")[0]
                  ) == "Cult" ||
                  this.game.getRoleAlignment(
                    villageVotes[x].voter.getRoleAppearance().split(" (")[0]
                  ) == "Mafia"
                ) {
                  if (voteCounts[villageVotes[x].target] == maxVotes) {
                    if (maxTarget == null) {
                      maxTarget = villageVotes[x].target;
                    } else if (villageVotes[x].target != maxTarget) {
                      tied = true;
                    }
                    this.role.data.evilVoted = true;
                    this.role.data.voteTied = tied;
                  }
                }
              }
            },
          });

          this.game.queueAction(action);
        }

        if (stateInfo.name.match(/Night/)) {
          var action2 = new Action({
            role: this,
            actor: this.player,
            game: this.player.game,
            priority: PRIORITY_INVESTIGATIVE_DEFAULT,
            labels: ["investigate"],
            run: function () {
              let outcome = "No";
              var alert;

              if (this.role.data.voteTied == true) {
                alert = `:invest: There was no majority vote yesterday!`;
                this.actor.queueAlert(alert);
                return;
              }

              if (this.role.data.VotingLog.length <= 0) return;
              if (this.actor.hasEffect("FalseMode")) {
                if (this.role.data.evilVoted) {
                  this.role.data.evilVoted = false;
                } else {
                  this.role.data.evilVoted = true;
                }
              }

              if (this.role.data.evilVoted == true) {
                alert = `:invest: You ran the numbers... the forces of Evil did vote with the majority yesterday!`;
              } else {
                alert = `:invest: You ran the numbers... the forces of Evil did NOT vote with the Majority yesterday!`;
              }

              if (
                this.game.RoomOne.length > 0 &&
                this.game.RoomTwo.length > 0
              ) {
                if (this.role.data.evilVoted == true) {
                  alert = `:invest: You ran the numbers... the forces of Evil did vote with the Majority in your Room yesterday!`;
                } else {
                  alert = `:invest: You ran the numbers... the forces of Evil did NOT vote with the Majority in your Room yesterday!`;
                }
              }

              this.actor.queueAlert(alert);
            },
          });
          this.game.queueAction(action2);
        }
      },
      vote: function (vote) {
        if (vote.meeting.name === "Village") {
          let votes = this.data.VotingLog;

          for (let y = 0; y < votes.length; y++) {
            if (votes[y].voter == vote.voter) {
              this.data.VotingLog[y] = vote;
              return;
            }
          }
          this.data.VotingLog.push(vote);
        } else if (
          vote.meeting.name === "Room 1" &&
          this.game.RoomOne.includes(this.player)
        ) {
          let votes = this.data.VotingLog;

          for (let y = 0; y < votes.length; y++) {
            if (votes[y].voter == vote.voter) {
              this.data.VotingLog[y] = vote;
              return;
            }
          }
          this.data.VotingLog.push(vote);
        } else if (
          vote.meeting.name === "Room 2" &&
          this.game.RoomTwo.includes(this.player)
        ) {
          let votes = this.data.VotingLog;

          for (let y = 0; y < votes.length; y++) {
            if (votes[y].voter == vote.voter) {
              this.data.VotingLog[y] = vote;
              return;
            }
          }
          this.data.VotingLog.push(vote);
        }
      },
    };
  }
};
