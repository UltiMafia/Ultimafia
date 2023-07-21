module.exports = function (type, name, msg) {
  let templates = {
    anon: `Someone says ${msg}`,
    crier: `Someone cries ${msg}`,
  };

  return templates[type];
};
