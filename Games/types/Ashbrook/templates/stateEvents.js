module.exports = function (event) {
  let templates = {
    Eclipse: `Everything goes dark as an eclipse begins.`,
  };

  return templates[event];
};
