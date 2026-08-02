# Local Setup Guide (No Codespaces)

This guide gets Ultimafia running on **your own computer** so you can open it in a browser and test changes. You do **not** need GitHub Codespaces.

When you finish, you will:

1. Have the site running at **http://localhost:3001**
2. Be able to create a test account and use the lobby
3. See your code changes reflected as you edit files

If you get stuck, ask in the [Ultimafia Discord](https://discord.gg/C5WMFpYRHQ).

---

## Before you start

Install these three things. Restart your computer after installing if the installer asks you to.

| What | Why | Where to get it |
|------|-----|-----------------|
| **Git** | Downloads the project code | [git-scm.com](https://git-scm.com/downloads) |
| **Node.js 22.17.0** | Runs JavaScript tools the project expects | [nodejs.org](https://nodejs.org/) (pick the **22.x** LTS / Current build closest to **22.17.0**) or [nvm-windows](https://github.com/coreybutler/nvm-windows) / [nvm](https://github.com/nvm-sh/nvm) |
| **Docker Desktop** | Runs the database and the site in containers | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |

Also useful (optional but recommended):

- **Visual Studio Code** — [code.visualstudio.com](https://code.visualstudio.com/download) — for editing files and using the built-in terminal
- A free **GitHub** account — [github.com](https://github.com) — so you can fork the repo and open pull requests later

### Check that installs worked

Open a terminal:

- **Windows:** PowerShell or the VS Code terminal
- **Mac / Linux:** Terminal or the VS Code terminal

Run each command. You should see a version number (not an error):

```bash
git --version
node -v
npm -v
docker --version
docker compose version
```

`node -v` should show something like `v22.17.0` (or another `v22.x`).

**Docker Desktop must be running** before you start the site. On Windows/Mac, open the Docker Desktop app and wait until it says it is running.

---

## Step 1 — Fork and download the code

1. Open [github.com/UltiMafia/Ultimafia](https://github.com/UltiMafia/Ultimafia).
2. Click **Fork** (top right), then **Create fork**.
3. On **your** fork page, click the green **Code** button.
4. Copy the HTTPS URL (looks like `https://github.com/YOURNAME/Ultimafia.git`).
5. In a terminal, go to the folder where you want the project, then clone it:

```bash
git clone https://github.com/YOURNAME/Ultimafia.git
cd Ultimafia
```

Replace `YOURNAME` with your GitHub username.

You are now in the project folder. Keep the terminal in this folder for the rest of the guide.

---

## Step 2 — Set up Firebase (required for login)

Ultimafia uses Firebase so people can create accounts and sign in. You need your **own** free Firebase project for local testing. This does **not** affect the live ultimafia.com site.

### 2a. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with Google.
2. Click **Add project** / **Create a project**.
3. Name it something like `ultimafia-local`. Keep Google Analytics on if asked.
4. Finish creating the project.

### 2b. Register a web app and copy the config

1. In the project overview, click the **Web** icon (`</>`) to add a web app.
2. Give it a nickname (for example `local`) and register the app.
3. Firebase shows a config snippet that looks like this:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  projectId: "...",
  storageBucket: "....appspot.com",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

4. **Keep this page open** or copy those values into a notepad. You will paste them into `.env` files in Step 3.

### 2c. Download the service account key

1. Click the gear icon → **Project settings**.
2. Open the **Service accounts** tab.
3. Click **Generate new private key** → confirm.
4. A `.json` file downloads. Rename it to exactly:

```text
firebase.json
```

5. Move that file into your **Ultimafia project root** (same folder as `package.json` and `README.md`).

Do **not** commit `firebase.json` to GitHub. It is a secret key for your project.

### 2d. Turn on Email/Password sign-in

1. In Firebase, open **Build** → **Authentication** → **Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. (Optional) Enable **Google** if you want Google login locally.

### 2e. Authorized domains

Firebase usually already allows `localhost`. Confirm:

1. Authentication → **Settings** → **Authorized domains**.
2. Make sure **`localhost`** is listed.
3. You do **not** need `127.0.0.1` if you follow this guide and use `http://localhost:3001`.

---

## Step 3 — Create your environment files

The project needs two small config files with your Firebase values.

### 3a. Copy the templates

From the Ultimafia project root:

**Windows (PowerShell):**

```powershell
Copy-Item docs\server_env .env
Copy-Item docs\client_env react_main\.env
```

**Mac / Linux:**

```bash
cp docs/server_env .env
cp docs/client_env react_main/.env
```

You should now have:

- `.env` in the project root (backend)
- `react_main/.env` (frontend)

### 3b. Fill in Firebase values

Open both files in VS Code (or any text editor).

Replace the placeholder `x` values with the matching fields from your Firebase web config:

**In `.env` (root):**

| Variable | Use this Firebase field |
|----------|-------------------------|
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |
| `FIREBASE_MEASUREMENT_ID` | `measurementId` |

Leave `FIREBASE_JSON_FILE=firebase.json` as-is if your key file is named `firebase.json` in the project root.

Also replace the `x` values for these with **any random strings** (they are local secrets, not from Firebase):

- `SESSION_SECRET`
- `LOAD_BALANCER_KEY`
- `BOT_KEY`

**In `react_main/.env`:**

| Variable | Use this Firebase field |
|----------|-------------------------|
| `REACT_APP_FIREBASE_API_KEY` | `apiKey` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `REACT_APP_FIREBASE_PROJECT_ID` | `projectId` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `REACT_APP_FIREBASE_APP_ID` | `appId` |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | `measurementId` |

Leave the other lines alone unless you know you need to change them. Defaults already point at local Docker:

- Site: port `3001`
- API: `http://localhost:3000`

### 3c. reCAPTCHA (optional for first boot)

Signup can ask for a reCAPTCHA key (`REACT_APP_RECAPTCHA_KEY` in `react_main/.env`).

- You can leave the placeholder for now and come back if signup fails.
- Full steps: [setup-dependencies.md](./setup-dependencies.md)

### 3d. Email domains (if signup rejects your email)

Both `.env` files list allowed email domains (Gmail, Outlook, etc.). If your email domain is missing, add it to `EMAIL_DOMAINS` / `REACT_APP_EMAIL_DOMAINS` in both files, then restart the containers (Step 6).

---

## Step 4 — Install project dependencies

Still in the project root:

```bash
npm install
cd react_main
npm install
cd ..
```

This can take a few minutes the first time. Wait until both finish without errors.

---

## Step 5 — Start the site with Docker

Make sure **Docker Desktop is running**, then from the project root:

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml up -d --build
```

What this does:

- Builds and starts **MongoDB** (database), **Redis**, the **backend**, and the **frontend**
- Runs them in the background (`-d`)

The first build can take several minutes. Later starts are faster.

### Check that containers are up

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml ps
```

You should see containers named roughly like `mongodb`, `redis`, `backend`, and `web` in a running / up state.

### Watch logs if something looks wrong

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml logs --tail=50
```

---

## Step 6 — Open the site in your browser

1. Open: **http://localhost:3001**
2. If you see a blank page or a stuck loading screen, go straight to login:

   **http://localhost:3001/auth/login**

3. Create a **new** account. This is only for your local database, not the live site.

### Important URL rules

| Do this | Avoid this |
|---------|------------|
| `http://localhost:3001` | `http://127.0.0.1:3001` (Firebase auth often fails) |
| Port **3001** | Port **80** is also mapped, but stick to **3001** |

---

## Everyday commands

Use these from the **Ultimafia project root**.

**Start (after the first build):**

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml up -d
```

**Stop everything:**

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml down
```

**Restart after backend / env changes:**

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml restart
```

**Shortcut (optional):** many people add a shell alias so they do not retype the long compose line:

```bash
# Mac / Linux example
alias d="docker compose -f docker-compose-core.yml -f docker-compose-dev.yml"
# then: d up -d   |   d down   |   d logs --tail=50
```

### Editing code while the site is running

- Your project folder is mounted into Docker, so **frontend and many backend edits** show up without a full rebuild.
- If a backend change does not appear, restart:

```bash
docker compose -f docker-compose-core.yml -f docker-compose-dev.yml restart backend
```

- If the frontend looks broken after installing packages on Windows/Mac, reinstall frontend packages **inside** Linux (the container OS):

```bash
docker run --rm -v "${PWD}:/home/um" -w /home/um/react_main ultimafia-web:latest sh -c "npm install"
```

On PowerShell, `${PWD}` usually works; if not, use the full path to your Ultimafia folder.

---

## Optional — Play test games with bots

Local accounts start as normal users. To spawn bot players in-game:

1. Create and log into your local account first.
2. Open a Mongo shell in the Docker database container:

```bash
docker exec -it mongodb mongosh -u admin -p password --authenticationDatabase admin
```

(Default password is `password` from `docs/server_env`. Change the command if you changed `MONGO_USER` / `MONGO_PW` in `.env`.)

3. Run:

```js
use ultimafia
db.users.updateOne(
  { name: "YOUR_USERNAME_HERE" },
  { $set: { dev: "true" } }
)
db.users.find({}, { name: 1, dev: 1 })
```

4. Type `exit` to leave Mongo.
5. Refresh the site, host a setup, and use the **test tube** icon to spawn bots.

More detail: [setup-bot-games.md](./setup-bot-games.md) (use container name **`mongodb`**, not `mongo`, when using this Docker Compose setup).

---

## Troubleshooting

### Docker commands fail / “Cannot connect to the Docker daemon”

- Open **Docker Desktop** and wait until it is fully started.
- On Windows, make sure virtualization / WSL2 is enabled as Docker’s installer requires.

### Site will not load / blank screen

1. Go to **http://localhost:3001/auth/login** and sign up or log in.
2. Confirm you used **`localhost`**, not `127.0.0.1`.
3. Check containers: `docker compose -f docker-compose-core.yml -f docker-compose-dev.yml ps`
4. Check logs: `docker compose -f docker-compose-core.yml -f docker-compose-dev.yml logs --tail=80`

### Login / signup fails

- Double-check Firebase values in **both** `.env` files.
- Confirm `firebase.json` is in the project root.
- Confirm Email/Password is enabled in Firebase Authentication.
- Confirm `localhost` is an authorized domain.
- If your email domain is blocked, add it to the email domain lists in both `.env` files and restart.

### Port already in use

Something else is using port `3001`, `3000`, `2999`, or `27017`. Stop that program, or stop other Docker projects, then run `up -d` again.

### `npm install` errors on the frontend (esp. Windows)

Native packages (for example rspack bindings) can break when host OS packages are mixed with Linux containers. Prefer:

```bash
docker run --rm -v "${PWD}:/home/um" -w /home/um/react_main ultimafia-web:latest sh -c "npm install"
```

Then restart the web container.

### Do not use `sudo` for these steps

On Mac/Linux, avoid `sudo` for `npm` / project scripts unless you know why you need it. It often causes permission problems that are hard to undo.

### Codespaces vs this guide

If a different guide mentions **Codespaces**, `/workspaces/Ultimafia`, or port forwarding globes in VS Code, that is the cloud setup. This local guide uses **Docker Desktop on your machine** and **http://localhost:3001**.

---

## What to learn next

- [Role creation guide](./guide-role-creation.md)
- [Role icon guide](./guide-role-icons.md)
- [Firebase / reCAPTCHA / other API keys](./setup-dependencies.md)
- [Bot games](./setup-bot-games.md)

When you are ready to contribute: create a branch, make your changes, push to your fork, and open a pull request against UltiMafia `master`.
