module.exports = {
  apps: [
    {
      name: "games",
      script: "./Games/games.js",
      autorestart: false,
    },
    {
      name: "www",
      script: "./bin/www",
    },
    {
      name: "chat",
      script: "./modules/chat.js",
    },
  ],
};
