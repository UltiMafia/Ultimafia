const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should();
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

function makeUsers(amt) {
  var users = [];

  for (let i = 0; i < amt; i++) users.push(makeUser());

  return users;
}

async function makeGame(setup, stateLength) {
  stateLength = stateLength || 0;

  const users = makeUsers(setup.total);
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: {
        Day: stateLength,
        Night: stateLength,
      },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();

  for (let user of users) await game.userJoin(user);

  return game;
}

function getRoles(game) {
  var roles = {};

  for (let player of game.players) {
    let roleName = player.role.name;

    if (!roles[roleName]) roles[roleName] = player;
    else if (Array.isArray(roles[roleName])) roles[roleName].push(player);
    else {
      let existingPlayer = roles[roleName];
      roles[roleName] = [];
      roles[roleName].push(existingPlayer);
      roles[roleName].push(player);
    }
  }

  return roles;
}

function addListenerToPlayer(player, eventName, action) {
  player.user.socket.onClientEvent(eventName, action);
}

function addListenerToPlayers(players, eventName, action) {
  for (let player of players) addListenerToPlayer(player, eventName, action);
}

function addListenerToRoles(game, roleNames, eventName, action) {
  const players = game.players.filter(
    (p) => roleNames.indexOf(p.role.name) != -1
  );
  addListenerToPlayers(players, eventName, action);
}

function waitForResult(check) {
  return new Promise((resolve, reject) => {
    var interval = setInterval(() => {
      try {
        if (check()) {
          clearInterval(interval);
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    }, 100);
  });
}

function waitForGameEnd(game) {
  return waitForResult(() => game.finished);
}
