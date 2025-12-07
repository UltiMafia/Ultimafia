const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_DAY_DEFAULT, PRIORITY_KILL_DEFAULT } = require("../const/Priority");
const { MEETING_PRIORITY_DAY } = require("../const/MeetingPriority");

module.exports = class SphinxRiddle extends Item {
  constructor(sphinxPlayer, numberSequence) {
    super("SphinxRiddle");
    this.sphinxPlayer = sphinxPlayer;
    this.numberSequence = numberSequence;
    this.hasGuessed = false;
    this.lifespan = 1; // Remove at end of day
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Guess Number Sequence": {
        states: ["Day"],
        flags: ["voting", "mustAct", "instant"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Guess",
          placeholder: "Enter your guess",
        },
        priority: MEETING_PRIORITY_DAY,
        action: {
          item: this,
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.item.hasGuessed) {
              return; // Already guessed
            }

            const guess = this.target.trim();
            if (!/^\d+$/.test(guess)) {
              this.game.sendAlert("Invalid input. Please enter only digits.", [
                this.actor,
              ]);
              return;
            }

            this.item.hasGuessed = true;
            this.item.checkGuess(guess, this.actor);
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        // Remove item at end of day if not guessed
        if (this.game.getStateName() == "Night") {
          this.drop();
        }
      },
    };
  }

  checkGuess(guess, guesser) {
    const correctSequence = this.numberSequence;
    const guessDigits = guess.split("").map(Number);
    const correctDigits = correctSequence.split("").map(Number);

    // Check if guess is correct
    if (guess === correctSequence) {
      // Correct guess - kill the Sphinx
      const action = new Action({
        actor: this.sphinxPlayer,
        target: this.sphinxPlayer,
        game: this.holder.game,
        labels: ["kill", "permanent"],
        priority: PRIORITY_KILL_DEFAULT,
        run: function () {
          this.target.kill("sphinx", this.actor, false);
        },
      });

      this.game.queueAction(action);
      this.drop();
      return;
    }

    // Incorrect guess - kill the guesser and give hints
    const hints = this.calculateHints(guessDigits, correctDigits);

    const killAction = new Action({
      actor: guesser,
      target: guesser,
      game: this.holder.game,
      labels: ["kill", "permanent"],
      priority: PRIORITY_KILL_DEFAULT,
      run: function () {
        this.target.kill("eaten", this.actor, false);
      },
    });

    this.game.queueAction(killAction);

    // Give hints to all players
    const hintAction = new Action({
      game: this.holder.game,
      labels: ["hidden"],
      priority: PRIORITY_DAY_DEFAULT + 1,
      run: function () {
        const hintMessage = `Hint: ${hints.join(", ")}`;
        this.game.queueAlert(hintMessage);
      },
    });

    this.game.queueAction(hintAction);
    this.drop();
  }

  calculateHints(guessDigits, correctDigits) {
    const hints = [];
    const guessLength = guessDigits.length;
    const correctLength = correctDigits.length;

    // Track which positions are already matched (Fermi)
    const matchedGuess = new Array(guessLength).fill(false);
    const matchedCorrect = new Array(correctLength).fill(false);

    // First pass: Count correct digits in correct positions (Fermi)
    let fermiCount = 0;
    for (let i = 0; i < Math.min(guessLength, correctLength); i++) {
      if (guessDigits[i] === correctDigits[i]) {
        fermiCount++;
        matchedGuess[i] = true;
        matchedCorrect[i] = true;
      }
    }

    // Second pass: Count correct digits in wrong positions (Pico)
    let picoCount = 0;
    for (let i = 0; i < guessLength; i++) {
      if (matchedGuess[i]) continue; // Already used for Fermi

      for (let j = 0; j < correctLength; j++) {
        if (matchedCorrect[j]) continue; // Already used for Fermi

        if (guessDigits[i] === correctDigits[j]) {
          picoCount++;
          matchedGuess[i] = true;
          matchedCorrect[j] = true;
          break; // Each guess digit can only match one correct digit
        }
      }
    }

    // Add hints
    if (fermiCount > 0) {
      hints.push(`Fermi: (${fermiCount} correct digit(s) in correct location)`);
    }
    if (picoCount > 0) {
      hints.push(`Pico: (${picoCount} correct digit(s) in wrong location)`);
    }
    if (fermiCount === 0 && picoCount === 0) {
      hints.push("Bagel: (no correct digits)");
    }

    return hints;
  }
};

