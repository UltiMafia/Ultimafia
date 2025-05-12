module.exports = function (type, name) {
  const templates = {
    condemn: `${name} was condemned to the gallows.`,
  };

  return templates[type];
};
