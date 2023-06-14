module.exports = function (type, name, msg) {
  const templates = {
    anon: `Someone says ${msg}`,
    crier: `Someone cries ${msg}`,
  };

  return templates[type];
};
