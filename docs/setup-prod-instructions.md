# Production setup

## Initial setup

Amazon Linux 2023 instructions:
```
sudo yum update -y
sudo yum -y install git dockerd
sudo usermod -a -G docker ec2-user

DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.38.2/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
docker compose version

sudo systemctl enable docker
sudo systemctl start docker
```

Add this alias to your `~/.bashrc`:
```
alias d="docker compose -f docker-compose-core.yml -f docker-compose-prod.yml"
```

Clone:
```
git clone https://github.com/UltiMafia/Ultimafia.git
cd UltiMafia
```

Do NOT run `totalsetup.sh` as it will apply dev settings.
Instead, manually copy the development configs. We will edit these two files.

```bash
cp ./docs/client_env ./react_main/.env
cp ./docs/server_env ./.env
```

### Configuration values

Make the following modifications to the two ENV files:

1. `./.env:`
```
NODE_ENV=production
BASE_URL=https://<your domain name>

SECRET_ID=<not sure what this is for>

RECAPTCHA_KEY=<your recaptcha key>

MONGO_URL=mongodb
MONGO_DB=ultimafia
MONGO_USER=admin
MONGO_PW=<strong admin password>

FIREBASE_...: See below

IP_API_KEY=<your ip api key>

DISCORD_ERROR_HOOK=<your discord error webhook>
DISCORD_GAME_HOOK=<your discord game webhook>
DISCORD_CLIENT_ID=<your discord client id>
DISCORD_CLIENT_SECRET=<your discord client secret>
```

2. `./react_main/.env:`
```
REACT_APP_URL=https://<your domain name>
REACT_APP_SOCKET_URI=<your domain name>
REACT_APP_SOCKET_PROTOCOL=wss

REACT_APP_FIREBASE_...: see below

REACT_APP_ENVIRONMENT=production

REACT_APP_RECAPTCHA_KEY=<your recaptcha api key>
```

Follow the same steps as in the EZ guide for firebase.
At the end, INSTEAD of adding 127.0.0.1 as an authorized domain, authorize your website's domain.

### Certificate setup

Make sure that your domain resolves to your IP for this section.

Edit lines 5 & 8 of this file:
`./certbot/init-letsencrypt.sh`

Modified lines should look like this:
```
domains=("my-domain.com")
email="myemail@gmail.com"
```

Now, run the init-letsencrypt.sh script.

### Building and composing containers

1. Install NVM, node, npm, and backend dependencies
   ```bash
   $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   $ source ~/nvm/nvm.sh
   $ nvm install 22.17.0
   $ nvm use 22.17.0
   $ nvm alias default 22.17.0
   $ npm install
   ```

2. Build and deploy the containers using the dev docker compose (this is using the alias from earlier)
   ```bash
   $ d up -d
   ```
