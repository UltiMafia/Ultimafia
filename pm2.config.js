module.exports = {
  apps: [
    {
      name: "games",
      script: "./Games/games.js",
      autorestart: false,
      time: true,
    },
    {
      name: "www",
      script: "./bin/www",
      time: true,
    },
    {
      name: "chat",
      script: "./modules/chat.js",
      time: true,
    },
  ],
};
