module.exports = function (type, name) {
  const templates = {
    basic: `${name} has come back to life!`,
    regurgitate: `${name} is pulled out of the slime, writhing!`,
  };

  return templates[type];
};
