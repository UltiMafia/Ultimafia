module.exports = function (event) {
  let templates = {
    "Full Moon": `A full moon lights the night sky.`,
    Eclipse: `Everything goes dark as an eclipse begins.`,
    Leaderless: `Chaos ensues following the death of your leader.`,
  };

  return templates[event];
};
