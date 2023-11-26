module.exports = {
  apps: [
    {
      "name": "games",
      "script": "./Games/games.js",
      "autorestart": false,
      "time": true,
      "node-args": ["--debug=7000"],
    },
    {
      "name": "www",
      "script": "./bin/www",
      "time": true,
      "node-args": ["--debug=7000"],
    },
    {
      "name": "chat",
      "script": "./modules/chat.js",
      "time": true,
      "node-args": ["--debug=7000"],
    },
  ],
};
