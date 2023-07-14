const unique4 = require("./unique-letters-4");
const unique5 = require("./unique-letters-5");
const duplicate4 = require("./duplicate-letters-4");
const duplicate5 = require("./duplicate-letters-5");

// set word list based on game settings
module.exports = {
  4: {
    // duplicate 4
    true: {
      raw: duplicate4,
      set: new Set(duplicate4),
    },
    // unique 4
    false: {
      raw: unique4,
      set: new Set(unique4),
    },
  },
  5: {
    // duplicate 5
    true: {
      raw: duplicate5,
      set: new Set(duplicate5),
    },
    // unique 5
    false: {
      raw: unique5,
      set: new Set(unique5),
    },
  },
};
