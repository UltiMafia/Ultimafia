const crypto = require('crypto');
const Effect = require("../Effect");
const Random = require("../../../../lib/Random");

module.exports = class Insanity extends Effect {

    constructor() {
        super("Insanity");
    }

    apply(player) {
        super.apply(player);

        player.role.meetings["Village"].canVote = false;
    }

    remove() {
        this.player.role.meetings["Village"].canVote = true;
        
        super.remove();
    }

    speak(message) {
        message.content = this.makeStringInsane(message.content);
        message.parseForReview = this.parseForReview;
        message.modified = true;
    }

    speakQuote(quote) {
        quote.cancel = true;
    }

    parseForReview(message) {
        message.content = message.versions["*"].content;
        return message;
    }

    makeStringInsane(string) {
        // Generating the shuffled encryption key.
        const unshuffledKey = "I can still feel it in my mind, watching my every move...".split("");
        let secretKey = "";
        while (unshuffledKey.length > 0) {
            secretKey += unshuffledKey.splice(Random.randInt(0, unshuffledKey.length - 1), 1)[0];
        }

        // Converting to 32 bytes used by AES.
        const encryptionKey = Buffer.alloc(32);
        encryptionKey.write(secretKey, "utf8");

        // Encrypting message with AES. Also pad string by two characters because it doesn't work otherwise.
        const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, crypto.randomBytes(16));
        let encryptedString = cipher.update(string + "!!", "utf8", "base64");

        // Adding some spaces, just to be safe! That's how encryption works right?
        let index = 0;
        let spaceProbabilities = [0, 0.01, 0.05, 0.20, 0.45, 0.70, 0.85, 0.93, 0.98, 0.99, 1.00];
        for (let i=0; i<encryptedString.length; i++) {
            if (Random.randFloat() < spaceProbabilities[index]) {
                encryptedString = encryptedString.substring(0, i) + " " + encryptedString.substring(i);
                index = 0;
            } else {
                index += 1;
            }
        }
        return encryptedString;
    }
};