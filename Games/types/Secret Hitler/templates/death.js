module.exports = function (type, name) {
    const templates = {
      presidentialExecution: `${name} was executed by the President.`,
    };
  
    return templates[type];
  };