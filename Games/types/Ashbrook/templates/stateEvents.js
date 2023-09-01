module.exports = function (event) {
  let templates = {
    Eclipse: `Everything goes dark as an eclipse begins.`,
    Pioneerless: `Chaos ensues following the death of your Pioneer.`,
  };

  return templates[event];
};
