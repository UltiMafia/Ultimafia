module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    lynch: `${name} was executed by the village.`,
    leave: `${name} left the game.`,
  };

  return templates[type];
};
