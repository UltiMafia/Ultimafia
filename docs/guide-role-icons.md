# Role Icon Creation Guide

This guide is intended for contributions that are primarily aesthetic in nature and do not require testing. If you intend to write roles and game features, please follow the main [setup guide](/docs/setup-guide.md).

## Role Icon Specification

- 30px by 40px
- Best to leave ~2px margins around
- Editing software: [piskel (free)](https://www.piskelapp.com/p/create/sprite), aseprite (paid)

## Adding Icons to the Repository

**Key Resources**

- [Spritesheet](/react_main/public/images/roles.png)
- [Role css](/react_main/src/css/roles.css)

### Step 1: Add Role Icon to the Spritesheet

Download the [role spritesheet](/react_main/public/images/roles.png).

[**Piskel** (free online editor)](https://www.piskelapp.com/p/create/sprite)

- Import spritesheet as a single image
- Paste the sprite in any blank "box"
- You can enable gridlines with Preferences > Grid, but you cannot select 30px x 40px as the grid size.

[**Gimp** (free software download)](https://www.gimp.org/downloads/)

- Can be easier to add icons because it has gridlines.
- `File` > `Open Image`
- `View` > `Show Grid`
- `Image` > `Configure Grid`. Disable aspect ratio (chain icon below sizing), then set horizontal 30px vertical 40px.
- Scroll to 800% zoom (see the zoom value at the bottom dock)
- Export the new spritesheet. `File` > `Overwrite roles.png`.

### Step 2: Setup (one-time)

1. Create an account on [Github](https://github.com), which you can think of like a GoogleDrive for code.

2. Go to [UltiMafia/Ultimafia](https://github.com/UltiMafia/Ultimafia).

3. At the top right, click "Fork" to create your personal copy of UltiMafia, e.g. `DrSharky/Ultimafia`.

4. Go to your fork's webpage, which should be `https://github.com/<your_username>/Ultimafia`.

5. Create a codespace on your fork.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/37830841-818e-4f81-8e57-b3397215e7cb" alt="create codespace" width="700"/>

How it works: you will make edits to your personal repository, and then make a request for your changes to be accepted into the master copy.

### Step 3: Syncing your repository

This step is important to prevent git conflicts.

1. Open the terminal. `Navigation` > `View` > `Terminal`, or <kbd>Ctrl</kbd> + <kbd>`</kbd>.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/e61872fc-94c8-439b-9254-69db48c4f851" alt="open terminal" width="300"/>

2. Stash away your previous changes.

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
git checkout -b add-mafioso-icon
```

### Step 4: Make Code Changes

#### Spritesheet

- Navigate to `react_main/public/images/roles.png`
- Drag and drop the new spritesheet in, selecting "replace image".

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/71335c2d-b763-4255-9fcc-0ff8f9c6c3c9" alt="drag image" width="700"/>

#### Role CSS

- Navigate to `/react_main/src/css/roles.css`
- Each role has its own css defined, such as the ones below.
- The two numbers represent the role's offset on the spritesheet, \[`horizontal_offset`, `vertical offset`\].

```
.role-Mafia-Blacksmith {
  background-position: -300px -40px;
}

.role-Mafia-Monkey {
  background-position: -30px -80px;
}
```

**Determining the offset of your role icon**

- Horizontal offset: From Left to Right, it is `0px` for the first column, then `-30px`, `-60px`...
- Vertical offset: From Top to Bottom, it is `0px` for the first row, then `-40px`, `-80px`...
- Tip: If you are lazy to calculate, find another role on the same row (`horizontal_offset`) and column (`vertical_offset`) as your icon.

Extra info: What do offsets mean? You can imagine a frame on the first `30px` by `40px` of the spritesheet. E.g. Mayor has offset \[`-60px`, `-40px` \]. This means you would move the image left by `60px`, i.e. two horizontal frames. You would also move the image up by `40px`, i.e. one vertical frame. These actions would position your icon in the reference frame.

**Adding role css**

- Create a new css class for your role.
- Note the position of where you add the css.
- Roles are sorted by alignment, `Village` > `Mafia` > `Independent` > `Hostile` > `Cult`. Within each alignment, roles are sorted by the **row** in which they appear.

```
.role-Mafia-<RoleName> {
    background-position: -30(horizontal)px -40(vertical)px;
}
```

### Step 5: Git commands to "upload" the code to Github

1. Check the changes made. You should be on your role branch, with only two files modified - the spritesheet and the role css.

```
git status
```

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/3e5be293-458f-48e7-bd95-6928d9c5a3aa" alt="git status example" width="700"/>

You can also type this command to double check the changes to the role css. It will show you which lines have been added or modified.

```
git diff react_main/src/css/roles.css
```

2. Confirm your changes by committing.

```
git commit -a -m "added mafioso icon"
```

The confirmatory message will be like this:

```
[add-example-icon abcde12] added example icon
 2 files changed, 4 insertions(+)
```

3. Upload your code to Github (also known as "remote"). The branch name is what you see beside `abcde12` in the previous confirmatory message. Note that your copy won't be exactly `abcde12`

```
git push origin add-example-icon
```

### Step 6: Creating a Pull Request

The changes have been committed to your personal fork, e.g. `DrSharky/Ultimafia`. The site is running on a shared master copy, `UltiMafia/Ultimafia`.

1. Go to [UltiMafia/Ultimafia](https://github.com/UltiMafia/Ultimafia/pulls).

2. You might see a message prompting you to create a pull request.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/3470db37-9036-4fc5-9cab-bef1a7c9ff5c" alt="compare and pull" width="700"/>

Click `Compare & pull request` if you can, then you can skip Step 3.

3. If you do not see that automated message, click `New Pull Request`. Select "compare across forks". Find your repository in the red box, and find your branch name in the blue box.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/4fba3b1b-0be5-40e2-ab35-e7abf7aa4fb6" alt="compare across forks" width="700"/>

4. (Optional) Add your ign or any details in the description. You can also drag and drop the role icon sprites in for easier viewing.

5. Set the Pull Request title to `assets(role icon): added icon for XXXXX`

6. Click `Create Pull Request`, ensuring that it does not say "draft".

7. Your pull request (PR) will appear [here](https://github.com/UltiMafia/Ultimafia/pulls), and it will soon be reviewed.

### Step 7: Closing Codespace

Disclaimer: Every Github user has an allocated amount of Codespace usage each month. **If you are just developing role icons, you can skip this step**. However, if you run any other processes like containers in the background, then this step is important.

Once you have submitted your pull request, go back to your fork's webpage, i.e. `https://github.com/<your_username>/Ultimafia`.

You can either shutdown (can turn back on) or delete (need to recreate) the codespace.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/579fb094-dc6f-486e-9a61-1cd5de13c29d" alt="shutdown" width="700"/>
