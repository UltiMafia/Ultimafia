const { AsyncLocalStorage } = require("async_hooks");

const gameContext = new AsyncLocalStorage();

module.exports = gameContext;
