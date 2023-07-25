module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    condemn: `${name} was condemned to the gallows.`,
    leave: `${name} left the game.`,
  };

  return templates[type];
};
