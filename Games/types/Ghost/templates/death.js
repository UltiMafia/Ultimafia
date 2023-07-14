module.exports = function (type, name) {
  const templates = {
    condemn: `${name} was executed by the town.`,
  };

  return templates[type];
};
