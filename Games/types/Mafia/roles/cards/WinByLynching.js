const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_BY_LYNCHING } = require("../../const/Priority");

module.exports = class WinByLynching extends Card {
  constructor(role) {
    super(role);
    this.target = "";
    const deathReasons = [
      "putting pineapple on pizza",
      "shopping at five or six stores instead of one",
      "leaving their lights on at night",
      "backing up into your mailbox",
      "forgetting to water your plants",
      "unfriending you on UltiMafia",
      "Rickrolling you",
      "looking at you funny",
      "being wrong in Mafia once",
      "making you look bad",
      "chewing open-mouthed",
      "borrowing your lawnmower and never bringing it back",
      "stealing your lunch at work",
      "forgetting your birthday",
      "delivering a heinous rendition of REM's 'Everybody Hurts' on karaoke night",
      "spoiling the ending of 'The Sopranos'",
      "forgetting to flush after using the bathroom",
      "cutting in line in front of you at HEB",
      "not showering for three days straight",
      "letting the dirty dishes pile up to an unacceptable level",
      "getting a crack in your favourite coffee mug",
      "hogging your side of the blanket in bed",
      "supporting the Yankees",
      "moaning at the council about the streets being full of litter, not stopping to think that it is people who drop litter, not the council",
    ];

    this.winCheck = {
      priority: PRIORITY_WIN_BY_LYNCHING,
      againOnFinished: true,
      check(counts, winners, aliveCount) {
        if (this.data.targetLynched) {
          winners.addPlayer(this.player, this.name);
          return true;
        }
      },
    };
    this.listeners = {
      roleAssigned(player) {
        if (player !== this.player) {
          return;
        }

        const nonMafia = this.game.players.filter(
          (p) =>
            (p.role.alignment === "Village" || p.role.winCount === "Village") &&
            p.alive &&
            p !== this.player
        );
        this.target = Random.randArrayVal(nonMafia);
        this.pettyReason = Random.randArrayVal(deathReasons);
        this.player.queueAlert(
          `You wish to see ${this.target.name} executed for ${this.pettyReason}.`
        );
      },
      death(player, killer, deathType) {
        if (
          player === this.target &&
          deathType === "lynch" &&
          this.player.alive
        ) {
          this.data.targetLynched = true;
        }
      },
    };
  }
};
