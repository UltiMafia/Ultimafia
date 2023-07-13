module.exports = function (type, name) {
  const templates = {
    condemn: `${name} was condemned to burning by the town.`,
  };

  return templates[type];
};
