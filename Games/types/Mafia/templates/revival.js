module.exports = function (type, name) {
  const templates = {
    basic: `${name} has come back to life!`,
    regurgitate: `Covered in goop, ${name} has been spewed out by the Blob!`,
  };

  return templates[type];
};
