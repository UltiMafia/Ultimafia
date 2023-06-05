module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    leave: `${name} left the game.`,
    veg: `${name} turned into a vegetable.`,
  };

  return templates[type];
};
