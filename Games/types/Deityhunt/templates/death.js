module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    condemn: `${name} was executed by the village.`,
    leave: `:sy9e: ${name} left the game.`,
    veg: `:sy9d: ${name} turned into a vegetable.`,
  };

  return templates[type];
};
