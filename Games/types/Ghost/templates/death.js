module.exports = function (type, name) {
  const templates = {
    lynch: `${name} was executed by the town.`,
  };

  return templates[type];
};
