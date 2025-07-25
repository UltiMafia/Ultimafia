# UltiMafia Ultimate Setup and Beginner Contribution Guide

## Step 1: Setup Github and Fork

1. Create a Github account.

2. Fork the repository from the top right of this page. You will make edits to your personal fork, and then make a request for your changes to be accepted into the master copy.

## Step 2: Setup Github Codespace

### About Github Codespace

Github Codespace is a cloud workspace where small amounts of code can be executed for free. Disclaimer: It is a billable service. You can monitor your usage and billing [here](https://github.com/settings/billing). There will be a section to track your Codespace usage.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/813494b6-1550-4ec4-9669-dc7d319cc974" alt="codespace billing" width="700"/>

By default, the spending limit is $0 so you won't be charged. The monthly quota should be sufficient for light testing of this repository.

### Create a Codespace

1. Create a Codespace from your fork.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/37830841-818e-4f81-8e57-b3397215e7cb" alt="create codespace" width="700"/>

2. Configure node in the codespace terminal. For consistency, this project uses `22.17.0`.

```
nvm install 22.17.0
nvm alias default 22.17.0
```

3. Download [Visual Studio Code (VS Code)](https://code.visualstudio.com/download).

4. Connect to this codespace using VS Code. You will be prompted to install a Github Codespace extension.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/9fab3e1a-9313-4caf-b0a2-c6242773616b" alt="open in desktop" width="300"/>

### Important: Stopping Codespace

This repository runs mongo, redis and node services in the background. It can cause your codespace usage to rack up overnight. You can shutdown your instance after each development and testing session.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/579fb094-dc6f-486e-9a61-1cd5de13c29d" alt="shutdown" width="700"/>

## Step 3: Setup the Project

### Install Mongo and Redis

1. Run the redis container.

```
docker run -d -p 6379:6379 --name redis --restart=always redis
```

2. Run the mongo container.

```
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password -v local-mongo:/data/db --name mongo --restart=always mongo
```

3. Enter the mongo shell.

```
docker exec -it mongo mongosh
```

4. Authenticate as admin. The default password (configured in Step `3.2`) is `password`.

```
test> use admin
switched to db admin

admin> db.auth('admin', passwordPrompt())
Enter password
********{ ok: 1 }
```

5. Create a database.

```
admin> use ultimafia
switched to db ultimafia
```

6. Exit the mongo shell.

```
ultimafia> exit
```

### Install node modules

1. Install pm2 globally.

```bash
npm i -g pm2
```

2. Install backend node modules.

```bash
cd /workspaces/Ultimafia/
npm install
```

3. Install frontend node modules.

```bash
cd react_main
npm install
```

### Set Environment Variables

1. Create the backend `.env`.

```
cp docs/server_env /workspaces/Ultimafia/.env
```

2. Create the frontend `.env`. Note that this file is under the `react_main` subdirectory.

```
cp docs/client_env /workspaces/Ultimafia/react_main/.env
```

3. Follow [this guide](/docs/setup-dependencies.md) for retrieving your own test API keys for Firebase and reCAPTCHA. As you follow the guide, fill in the `.env` files.

### Start the Site

1. Start the backend server

```
cd /workspaces/Ultimafia
npm start
```

2. Start the frontend React app

```
cd react_main
npm start
```

3. Check that the forwarded ports are on localhost `127.0.0.1`.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/8b55358f-6da7-4407-8b1c-c07e6dbc1394" alt="ports" width="300"/>

4. You can now view your test site and create your own test account. Find the port that is `3001`, and click the globe icon to "Open in Browser".

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/cc9ac2e8-bde6-4014-b607-384ce414ef2f" alt="open in browse" width="300"/>

This account is not affiliated to `ultimafia.com`. If your email domain is not accepted, look for the email section in both `.env` files.

## Step 4: Setting up Bot Games

To play games with bots, we need to add the `dev` property to your user. Make sure that you first create an account on your test site.

1. Enter the mongo shell via `mongosh`.

```
docker exec -it mongo mongosh
```

2. Authenticate as admin.

```
test> use admin
switched to db admin

admin> db.auth('admin', passwordPrompt())
Enter password
********{ ok: 1 }

admin>
```

3. Enter the ultimafia collection.

```
admin> use ultimafia
switched to db ultimafia
```

5. Add the dev property to your user.

```
ultimafia> db.users.updateOne(
    { name: '<username>' },
    { $set: {dev: 'true'} })

{
  acknowledged: true,
  modifiedCount: 1
}
```

6. Check that your user has the dev property.

```
ultimafia> db.users.find({}, {name:1, dev:1})
[
  {
    _id: ObjectId('XXX'),
    name: '<username>',
    dev: 'true'
  }
]
```

### Testing games with bots

1. Create and host a setup.

2. A test tube icon appears in the top bar.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/a036535a-d107-4ecb-8c06-0a49629972fd" alt="test tube" width="300"/>

3. Click the test tube icon and bot accounts will spawn in new windows. Remember to enable pop-up windows in your browser.

## Step 5: Syncing your repository

1. Stash away your previous changes.

```
git stash
```

3. Return to the master branch.

```
git checkout master
```

4. Get the latest updates from `UltiMafia/Ultimafia`'s master branch.

```
git pull upstream master
```

5. Create a new branch (i.e. code workspace) for your role. To avoid dealing conflicts, use a new branch name each time.

```
git checkout -b add-mafioso-role
```

You can now make code changes as needed.

## Step 6: Git commands to "upload" the code to Github

> This step can be done using [Github Desktop](https://desktop.github.com/). A guide for that will come soon.

1. Check the changes made. You should be on your role branch.

```
git status
```

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/3e5be293-458f-48e7-bd95-6928d9c5a3aa" alt="git status example" width="700"/>

You can also type this command to double check the changes made. It will show you which lines have been added or modified.

```
git diff
```

2. Confirm your changes by committing.

```
git commit -am "added mafioso role"
```

The confirmatory message will be like this:

```
[add-example-icon abcde12] added example icon
 2 files changed, 4 insertions(+)
```

3. Upload your code to Github (also known as "remote"). The branch name is what you see beside `abcde12` in the previous confirmatory message. Note that your copy won't be exactly `abcde12`

```
git push origin add-mafioso-role
```

## Step 7: Creating a Pull Request

The changes have been committed to your personal fork, e.g. `DrSharky/Ultimafia`. The site is running on a shared master copy, `UltiMafia/Ultimafia`.

1. Go to [UltiMafia/Ultimafia](https://github.com/UltiMafia/Ultimafia/pulls).

2. You might see a message prompting you to create a pull request.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/3470db37-9036-4fc5-9cab-bef1a7c9ff5c" alt="compare and pull" width="700"/>

Click `Compare & pull request` if you can, then you can skip Step 3.

3. If you do not see that automated message, click `New Pull Request`. Select "compare across forks". Find your repository in the red box, and find your branch name in the blue box.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/4fba3b1b-0be5-40e2-ab35-e7abf7aa4fb6" alt="compare across forks" width="700"/>

4. (Optional) Add any details in the description.

5. Set the Pull Request title to `feat: added mafioso role`

6. Click `Create Pull Request`, ensuring that it does not say "draft".

7. Your pull request (PR) will appear [here](https://github.com/UltiMafia/Ultimafia/pulls), and it will soon be reviewed.
