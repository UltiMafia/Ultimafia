module.exports = function (type, name) {
  const templates = {
    basic: `${name} has come back to life!`,
  };

  return templates[type];
};
