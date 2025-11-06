module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    conquest: `${name} has been conquered!`,
    leave: `${name} has surrendered!`,
  };

  return templates[type];
};
