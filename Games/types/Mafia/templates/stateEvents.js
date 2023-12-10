module.exports = function (event) {
  let templates = {
    "Full Moon": `A full moon lights the night sky.`,
    Eclipse: `Everything goes dark as an eclipse begins.`,
    Leaderless: `The Typist has died! Nobody can publicly record the votes...`,
  };

  return templates[event];
};
