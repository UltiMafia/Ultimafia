module.exports = function (event) {
  let templates = {
    "Full Moon": `A full moon lights the night sky.`,
    Eclipse: `Everything goes dark as an eclipse begins.`,
    VotesAnon: `Chaos ensues following the death of your Typist! Votes are now anonymous.`,
  };

  return templates[event];
};
