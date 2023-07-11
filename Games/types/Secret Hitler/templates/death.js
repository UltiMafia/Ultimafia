module.exports = function (type, name) {
  const templates = {
    presidentialExecution: `${name} was sentenced by the President to execution.`,
  };

  return templates[type];
};
