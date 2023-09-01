module.exports = function (type, name, msg) {
  let templates = {
    anon: `Someone says ${msg}`,
  };

  return templates[type];
};
