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

**New contributors:**

- **Local setup (your computer, no Codespaces):** [Local Setup Guide](/docs/setup-local-guide.md)
- **GitHub Codespaces:** [EZ setup guide](/docs/setup-EZ-guide.md)

If you have any questions or concerns please feel free to ask in our [Discord server](https://discord.gg/C5WMFpYRHQ).

### Prerequisites

Before building your developer environment locally, you will need the following set up:

- Git, Node.js 22.17.0, and Docker Desktop (see the [Local Setup Guide](/docs/setup-local-guide.md))
- Firebase

### Install and Build

For a full walkthrough aimed at beginners, use the [Local Setup Guide](/docs/setup-local-guide.md).

For an automated script (Mac/Linux / Codespaces), use the `totalsetup.sh` script in the root project directory:

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

Prefer Docker Compose as described in the [Local Setup Guide](/docs/setup-local-guide.md):

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml up -d
```

The site will be accessible at **http://localhost:3001**. Use `localhost` (not `127.0.0.1`) so Firebase Auth works. First-time login: **http://localhost:3001/auth/login**.

If you ran `totalsetup.sh`, the project may already be running. To stop Compose:

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml down
```

### Troubleshooting

#### 1. Site Does Not Load

If you are able to briefly see a loading graphic when attempting to enter the site before a blank screen, it is most likely due to a bug for the dev environment in which the launch screen will not load unless you are logged in.

To fix this:

1. Go to http://localhost:3001/auth/login
2. Sign-up with a new account. If you have already created an account in the past for your local build, you may use the same one to login instead.

Once you log in, you should be redirected to the lobby page and the site should function properly.

More local troubleshooting is in the [Local Setup Guide](/docs/setup-local-guide.md#troubleshooting).

## Contributing

1. Fork the repository
2. Make your changes to your forked repository
3. Open a pull request on the master branch of this repository
4. Perform a final test on the main site after merge into master

## Forum replies

Click a post's Reply arrow to open the composer beneath that post. Selecting
another post moves the same draft and appends its quote, preserving the existing
profile and original-post links. Page navigation keeps the draft at the footer;
Cancel or switching threads clears it.

Paste one still PNG, JPEG or WebP into the reply editor to preview it, and use
Remove image to discard only the attachment. Nothing uploads until Post.
The server accepts at most 5 MiB of image input, rejects animations (including
APNG), SVG, mismatched content types and images over 16 million pixels or an
8192-pixel side, and normalizes to WebP fitting 1024 × 1024 with a 1 MiB output
cap. The final Markdown, including its generated image URL, must fit the existing
20,000-character reply limit. Thread starters are unchanged.

The image is stored on its owning reply, not in public uploads. Image reads
require the category's viewing rank and hide deleted or pending replies and
parent threads, even from deleted-text viewers. Removing the exact generated
Markdown through Edit hides the image; restoring it restores access subject to
those same checks. Quotes reference the original image and its visibility.
Each reply stores at most 1 MiB of image data, which replication and backups
also include. No new storage service or credentials are required.

Focused checks: `npx mocha test/forumReplyImage.test.js test/forumReplyImageProjection.test.js`
and `node --test react_main/test/forumReplyComposer.test.mjs`. The route checks
mock persistence and permissions; the projection check uses the real schema with
a driver stub, not MongoDB. The browser fixture builds with
`cd react_main && npx rsbuild build --config rsbuild.forum-reply-test.config.ts`;
it mocks requests and uses sessionStorage, so it does not prove durable backend
storage. Run local MongoDB/Redis integration and deployment checks separately.

## Running the site on codespaces

### If you are a beginner, please follow [the easy setup guide](/docs/setup-EZ-guide.md) and ask in [Discord](https://discord.gg/C5WMFpYRHQ) if you are stuck at any step.

## Role and game creation

- [Role Creation Guide](/docs/guide-role-creation.md)
- [Role Icon Guide](/docs/guide-role-icons.md)

This site is based on the code provided by r3ndd from [this repository](https://github.com/r3ndd/BeyondMafia-Integration) and is used under the Creative Commons license (Attribution-NonCommercial-ShareAlike 4.0 International). It has been changed and is not affiliated with the creator or the website that uses the original repository's code.

## Additional Credits

Music is by Fred, check out his youtube [@fredthemontymole](https://www.youtube.com/@fredthemontymole)

## Sign in with Apple notifications

Apple sends account events to `POST /api/auth/apple/notifications` (set this
URL under the App ID's Sign in with Apple configuration in the Apple Developer
portal). The signed payload is checked against Apple's keys, `iss`, `exp`, and
`APPLE_SIWA_AUDIENCE` (see `docs/server_env`).

- `email-enabled` / `email-disabled`: stores `appleEmailForwarding` on the user.
- `consent-revoked`: revokes Firebase refresh tokens, clears site sessions, sets `appleConsentRevoked`.
- `account-delete`: same as above, sets `appleAccountDeleted` and logs for moderator follow-up. No data is deleted.

Apple does not send password or Apple ID email changes.
