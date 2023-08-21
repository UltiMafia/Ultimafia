# UltiMafia

This is the source code powering [UltiMafia.com](https://ultimafia.com), a website built to provide online chat mafia to all.

## Contributing

1. Fork the repository
2. Make your changes to your forked repository
3. Open a pull request on the master branch of this repository
4. Perform a final test on the main site after merge into master

## Running the site locally

> If you are a beginner, please follow [this beginner guide](/docs/setup-beginner-guide.md) and ask in [Discord](https://discord.gg/gFffU5cK8n) if you are stuck at any step.

#### Prerequisites

1. Install node.js, and set the version to `v14.15.1`.

2. Install MongoDB and Redis and run them as services. If using Windows, install Memurai instead of Redis. You can refer to [this guide](/docs/setup-mongo-redis-docker.md) for setting up MongoDB and Redis via docker.

3. Clone your forked repository. Replace "UltiMafia" with your github username.

```bash
git clone https://github.com/UltiMafia/Ultimafia.git
```

#### Install node modules

1. Install pm2 globally.

```bash
npm i -g pm2
```

2. Install backend node modules.

```bash
cd Ultimafia
npm install
```

3. Install frontend node modules.

```bash
cd react_main
npm install
```

#### Setup environment variables

1. Create `.env` file for the server under `Ultimafia/.env`, and copy this [example file](/docs/server_env)

2. Create a `.env` file for the React app under `Ultimafia/react_main/.env` and copy this [example file](/docs/client_env)

3. Refer to [this guide](/docs/setup-dependencies.md) for retrieving your own test API keys for Firebase and reCAPTCHA.

#### Start the site

1. Start the backend server

```bash
cd Ultimafia
npm start
```

2. Start the frontend React app

```bash
cd react_main
npm start
```

## Role and game creation

- [Role Creation Guide](/docs/guide-role-creation.md)
- [Role Icon Guide](/docs/guide-role-icons.md)

This site is based on the code provided by r3ndd from [this repository](https://github.com/r3ndd/BeyondMafia-Integration) and is used under the Creative Commons license (Attribution-NonCommercial-ShareAlike 4.0 International). It has been changed and is not affiliated with the creator or the website that uses the original repository's code.

## Contributors

Music is by Fred, check out his youtube [@fredthemontymole](https://www.youtube.com/@fredthemontymole)