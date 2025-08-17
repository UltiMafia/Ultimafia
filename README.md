# UltiMafia

This is the source code powering [UltiMafia.com](https://ultimafia.com), a website built to provide online chat mafia to all.

## Table of Contents

WIP

## Setup

It is recommended to set some kind of alias to shorten your docker compose commands, like so:

```
alias d="docker compose -f docker-compose-core.yml -f docker-compose-dev.yml"

# From here
```

The [EZ setup guide](/docs/setup-EZ-guide.md) is the best guide if you are a new contributor. If you have any questions or concerns please feel free to ask in our [Discord server](https://discord.gg/C5WMFpYRHQ).

### Prerequisites

Before building your developer environment locally, you will need the following set up:

- NVM (should be provided with your Github Codespace)
- Firebase

### Install and Build

For the easiest set up, use the `totalsetup.sh` script in the root project directory:

```bash
$ bash totalsetup.sh
```

If you want to perform your setup manually, follow these setups:

0. Load the default development environment ENV files

   ```bash
   $ cp ./docs/client_env ./react_main/.env
   $ cp ./docs/server_env ./.env
   ```

1. Install NVM, node, npm, and backend dependencies

   ```bash
   $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   $ source ~/nvm/nvm.sh
   $ nvm install 22.17.0
   $ nvm use 22.17.0
   $ nvm alias default 22.17.0
   $ npm install
   ```

2. Download front-end dependencies and build

   ```bash
   $ cd react_main
   $ npm install
   $ bash build.sh
   $ cd ..
   ```

3. Build and deploy the containers using the dev docker compose
   ```bash
   $ docker compose -f docker-compose-core.yml -f docker-compose-dev.yml up -d
   ```
   Use `docker compose -f docker-compose-core.yml -f docker-compose-dev.yml build` if you wish to build without running.

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

## Role and game creation

- [Role Creation Guide](/docs/guide-role-creation.md)
- [Role Icon Guide](/docs/guide-role-icons.md)

This site is based on the code provided by r3ndd from [this repository](https://github.com/r3ndd/BeyondMafia-Integration) and is used under the Creative Commons license (Attribution-NonCommercial-ShareAlike 4.0 International). It has been changed and is not affiliated with the creator or the website that uses the original repository's code.

## Additional Credits

Music is by Fred, check out his youtube [@fredthemontymole](https://www.youtube.com/@fredthemontymole)
