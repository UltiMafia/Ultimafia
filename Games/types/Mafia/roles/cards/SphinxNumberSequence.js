const Card = require("../../Card");

module.exports = class SphinxNumberSequence extends Card {
  constructor(role) {
    super(role);

    // Initialize number sequence as null - must be set on first night

    this.meetings = {
      "Choose Number Sequence": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        inputType: "text",
        textOptions: {
          minLength: 1,
          maxLength: 5,
          numericOnly: true,
          submit: "Confirm",
          placeholder: "e.g. 1234",
        },
        shouldMeet: function () {
          // Only show on first night if sequence not set
          return !this.numberSequence;
        },
        action: {
          labels: ["hidden"],
          priority: 0,
          role: this.role,
          run: function () {
            if (this.role.numberSequence != null) {
              return; // Already set
            }

            // Validate input - should be a sequence of digits
            const sequence = this.target.trim();
            if (!/^\d+$/.test(sequence)) {
              this.game.sendAlert("Invalid input. Please enter only digits.", [
                this.actor,
              ]);
              return;
            }

            if (sequence.length < 1 || sequence.length > 5) {
              this.game.sendAlert(
                "Number sequence must be between 1 and 5 digits.",
                [this.actor]
              );
              return;
            }

            // Check for no repeats
            const digits = sequence.split("");
            const uniqueDigits = new Set(digits);
            if (digits.length !== uniqueDigits.size) {
              this.game.sendAlert(
                "Number sequence cannot contain repeated digits.",
                [this.actor]
              );
              return;
            }

            // Store the number sequence
            this.role.numberSequence = sequence;
            this.actor.queueAlert(
              `You have chosen the number sequence: ${sequence}`
            );
          },
        },
      },
    };
  }
};
