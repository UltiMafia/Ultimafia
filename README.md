# UltiMafia

This is the source code powering [UltiMafia.com](https://ultimafia.com), a website built to provide online chat mafia to all.

## Table of Contents
WIP

## Setup
The [EZ setup guide](/docs/setup-EZ-guide.md) is the best guide if you are a new contributor. If you have any questions or concerns please feel free to ask in our [Discord server](https://discord.gg/C5WMFpYRHQ).

### Prerequisites
Before building your developer environment locally, you will need the following set up:
- NVM (should be provided with your Github Codespace)
- Firebase
- Recaptha
- 

### Install and Build

For the easiest set up, use the `totalsetup.sh` script in the root project directory:

```bash
$ bash totalsetup.sh
```
If you want to perform your setup manually, follow these setups:

1. Install the correct version of Node and NPM and set them to default
    ```bash
    $ source ~/nvm/nvm.sh
    $ nvm install 14.16.0
    $ nvm use 14.16.0
    $ nvm alias default 14.16.0
    ```
2. Download project root and front-end dependencies
    ```bash
    $ npm i -g pm2
    $ npm install
    $ cd react_main
    $ npm install
    ```

3. Build the front-end
    ```bash
    $ cd react_main
    $ npm run build
    $ rm -rf build_public
    $ cp -r build build_public
    $ rm -rf build
    $ cd ..
    ```
    You can run the `build.sh` in `react_main` script to automatically run these comands.

4. Build and deploy the backend
    ```bash
    $ docker-compose up -d --build
    ```
    Use `docker-compose build` if you wish to build without running.

There is a clean-up script you can run from the root project directory to remove all build files:

```bash
$ bash cleanup.sh
```

**NOTE**: do NOT use `sudo` when running any scripts or commands unless you are sure you know what you're doing. Running `sudo` is linked to many issues including permission problems.

### Running and Stopping

If you ran `totalsetup.sh`, the project will automatically run. Otherwise, you can run `npm start` from the root project directory. To stop, simply run `npm stop`. The site will be accessible at http://127.0.0.1:80 (localhost).

### Troubleshooting

#### 1. Site Does Not Load
If you are able to briefly see a loading graphic when attempting to enter the site before a blank screen, it is most likely due to a bug for the dev environment in which the launch screen will not load unless you are logged in.

To fix this:

1. Go to http://127.0.0.1:80/auth/login
2. Sign-up with a new account. If you have already created an account in the past for your local build, you may use the same one to login instead.

Once you log in, you should be redirected to the lobby page and the site should function properly.

## Contributing

1. Fork the repository
2. Make your changes to your forked repository
3. Open a pull request on the master branch of this repository
4. Perform a final test on the main site after merge into master

## Running the site on codespaces
### If you are a beginner, please follow [the easy setup guide](/docs/setup-EZ-guide.md) and ask in [Discord](https://discord.gg/C5WMFpYRHQ) if you are stuck at any step.

## Running the site locally
#### -OBSOLETE- This is for running your own development environment locally. You can still use this if you'd like by following the old [beginner's guide](/docs/setup-beginner-guide.md), but the easiest way is now the docker guide linked above.

#### Prerequisites

1. Install node.js, and set the version to `v14.16.0`.

2. Install MongoDB and Redis and run them as services. You can refer to [this guide](/docs/setup-mongo-redis-docker.md) for setting up MongoDB and Redis via Docker.

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

## Additional Credits

Music is by Fred, check out his youtube [@fredthemontymole](https://www.youtube.com/@fredthemontymole)
