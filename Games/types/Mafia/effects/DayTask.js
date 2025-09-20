const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../const/Priority");

module.exports = class DayTask extends Effect {
  constructor(taskCreator, player, reward, punishment, difficulty) {
    super("DayTask");
    this.taskCreator = taskCreator;
    this.reward = reward;
    this.punishment = punishment;
    this.player = player;
    this.HasBeenCompleted = false;
    this.HasBeenFailed = false;
    this.DiffNum = difficulty || 1;
    this.MessagesSent = 0;
    this.VotingLog = [];
    this.VoteSwitchCount = 0;

    let possibleTasks = [];
    let canDoTalkingTasks = this.player.alive || player.game.isTalkingDead();
    let canDoVotingTasks = this.player.alive || player.game.isVotingDead();
    let Roles = this.taskCreator.getAllRoles().map((r) => r.split(":")[0]);
    /*
    //Whispers
    if (this.game.setup.whispers && canDoTalkingTasks) {
      possibleTasks.push("WhisperAllLivingPlayers");
    }
    //Role based Task
    if (this.game.setup.whispers && canDoTalkingTasks && Roles.includes("Reaper")) {
      possibleTasks.push("ClaimReaper");
    }
    */
    //Talking
    if (canDoTalkingTasks) {
      possibleTasks.push("ClaimRole");
    }
    if (canDoTalkingTasks) {
      possibleTasks.push("SendNoMoreThen10Messages");
    }
    if (canDoTalkingTasks && this.DiffNum >= 1) {
      possibleTasks.push("SendExactly10Messages");
    }
    if (canDoTalkingTasks && this.DiffNum >= 2) {
      possibleTasks.push("SendNoMoreThen1Message");
    }
    //Voting
    if (canDoVotingTasks) {
      possibleTasks.push("VoteForAPlayer");
    }
    if (canDoVotingTasks) {
      possibleTasks.push("SwitchVotes3Times");
    }
    if (canDoVotingTasks && this.DiffNum >= 2) {
      possibleTasks.push("SwitchVotesExactly5Times");
    }
    /*
    if (canDoVotingTasks && this.DiffNum >= 3 && this.game.alivePlayers().length > 2) {
      possibleTasks.push("BeThe3rdPlayerToVoteToday");
    }
    */
    if (canDoVotingTasks && this.DiffNum >= 2) {
      possibleTasks.push("NeverSwitchVotes");
    }

    if (possibleTasks.length <= 0) {
      return;
    }

    this.task = Random.randArrayVal(possibleTasks);

    if (this.task == "VoteForAPlayer") {
      this.ExtraPlayer = Random.randArrayVal(this.player.game.alivePlayers());
    }
    if (this.task == "ClaimRole") {
      this.ExtraRole = Random.randArrayVal(Roles);
    }
    if (
      this.task == "SendNoMoreThen10Messages" ||
      this.task == "SendExactly10Messages"
    ) {
      if (this.task == "SendNoMoreThen10Messages") {
        this.HasBeenCompleted = true;
      }
      this.ExtraNum = Random.randArrayVal([5, 6, 7, 8, 9, 10, 11, 12]);
    }
    if (this.task == "SendNoMoreThen1Message") {
      this.HasBeenCompleted = true;
      this.ExtraNum = 1;
    }
    if (this.task == "NeverSwitchVotes") {
      this.HasBeenCompleted = true;
    }
    if (
      this.task == "SwitchVotes3Times" ||
      this.task == "SwitchVotesExactly5Times"
    ) {
      this.ExtraNum = Random.randArrayVal([3, 4, 5, 6, 7]);
    }
    if (!this.ExtraPlayer) {
      this.ExtraPlayer = Random.randArrayVal(this.player.game.alivePlayers());
    }

    this.listeners = {
      state: function () {
        if (this.game.getStateName() == "Day") {
          this.VotingLog = [];
          var action = new Action({
            role: this.taskCreator,
            game: this.player.game,
            effect: this,
            priority: PRIORITY_DAY_EFFECT_DEFAULT + 1,
            labels: ["hidden", "absolute"],
            run: function () {
              if (this.effect.HasBeenCompleted == true) {
                if (this.effect.reward) {
                  this.effect.reward.target = this.effect.player;
                  this.effect.reward.do();
                }
              } else {
                if (this.effect.punishment) {
                  this.effect.punishment.target = this.effect.player;
                  this.effect.punishment.do();
                }
              }
            },
          });

          this.game.queueAction(action);
        }
        if (
          this.game.getStateName() == "Day" &&
          this.task == "VoteForAPlayer"
        ) {
          let toDetonate = 60000;
          this.timer = setTimeout(() => {
            if (this.game.finished) {
              return;
            }
            if (this.HasBeenCompleted) {
              return;
            }
            this.HasBeenFailed = true;

            if (this.punishment) {
              this.punishment.target = this.player;
              this.game.instantAction(this.punishment);
            }

            this.timer = null;
          }, toDetonate);
        }
        if (this.game.getStateName() != "Night") return;
        this.remove();
      },
      vote: function (vote) {
        if (vote.meeting.useVotingPower == true && vote.voter === this.player) {
          if (
            vote.target === this.ExtraPlayer.id &&
            this.task == "VoteForAPlayer" &&
            this.HasBeenFailed != true
          ) {
            this.HasBeenCompleted = true;
          }
          if (this.VotingLog.length <= 0) {
            this.VotingLog.push(vote.target);
          } else if (!this.VotingLog.includes(vote.target)) {
            this.VoteSwitchCount++;
          }
          if (this.task == "NeverSwitchVotes" && this.VoteSwitchCount > 0) {
            this.HasBeenCompleted = false;
            if (this.punishment) {
              this.punishment.target = this.player;
              this.game.instantAction(this.punishment);
            }
          }
          if (
            this.task == "SwitchVotes3Times" &&
            this.VoteSwitchCount >= this.ExtraNum
          ) {
            this.HasBeenCompleted = true;
          }
          if (
            this.task == "SwitchVotesExactly5Times" &&
            this.VoteSwitchCount == this.ExtraNum
          ) {
            this.HasBeenCompleted = true;
          } else if (
            this.task == "SwitchVotesExactly5Times" &&
            this.VoteSwitchCount > this.ExtraNum
          ) {
            this.HasBeenCompleted = false;
            if (this.punishment) {
              this.punishment.target = this.player;
              this.game.instantAction(this.punishment);
            }
          }
        }
      },
    };
  }

  speak(message) {
    if (!this.task) {
      return;
    }
    if (this.HasBeenFailed) {
      return;
    }
    this.MessagesSent++;
    if (
      this.task == "SendNoMoreThen10Messages" ||
      this.task == "SendExactly10Messages" ||
      this.task == "SendNoMoreThen1Message"
    ) {
      if (this.ExtraNum < this.MessagesSent) {
        this.HasBeenFailed = true;
        this.HasBeenCompleted = false;
      } else if (
        this.task == "SendExactly10Messages" &&
        this.ExtraNum == this.MessagesSent
      ) {
        this.HasBeenCompleted = true;
      }
      if (this.HasBeenFailed == true && this.punishment) {
        this.punishment.target = this.player;
        this.game.instantAction(this.punishment);
        //this.punishment.do();
      }
    }
    if (
      this.task == "ClaimRole" &&
      message.content
        .replace(" ", "")
        .toLowerCase()
        .includes(this.ExtraRole.toLowerCase())
    ) {
      this.HasBeenCompleted = true;
    }
    /*
    if (
    ) {
      var action = new Action({
        actor: this.player,
        target: this.player,
        game: this.game,
        effect: this,
        labels: ["hidden"],
        run: function () {
          this.effect.StylePointsToday += 1;
          this.actor.queueAlert(`You gain 1 Style Point!`);
        },
      });

      this.game.instantAction(action);
      */
  }

  getTaskMessage() {
    switch (this.task) {
      case "ClaimRole":
        return `Say "${this.ExtraRole}" in chat.`;
      case "SendNoMoreThen10Messages":
        return `Not send more then ${this.ExtraNum} Messages in chat.`;
      case "SendExactly10Messages":
        return `Send Exactly ${this.ExtraNum} Messages in chat.`;
      case "SendNoMoreThen1Message":
        return `Not send more then ${this.ExtraNum} Message in chat.`;
      case "VoteForAPlayer":
        return `Vote for ${this.ExtraPlayer.name} within the first minute of the day.`;
      case "SwitchVotes3Times":
        return `Switch votes at least ${this.ExtraNum} times today.`;
      case "SwitchVotesExactly5Times":
        return `Switch votes Exactly ${this.ExtraNum} times today.`;
      case "NeverSwitchVotes":
        return `Not switch votes today.`;
      case "BeThe3rdPlayerToVoteToday":
        return `Be the 3rd player to cast a vote today.`;
    }
  }
};
