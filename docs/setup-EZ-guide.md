# Setup Easy Guide

This is the latest guide for setting up the repository in Github Codespaces.
You will need to download a development program that can connect to Github Codespaces.
The most recommended one is [Visual Studio Code.](https://code.visualstudio.com/download)

## Setup

### Firebase

1. Go to [Firebase](https://console.firebase.google.com) and create a project. 
Keep the Google Anayltics option on when creating the project.

2. Now create a new web app using the button as shown below.

<!-- <img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/1569714c-2704-4ddd-b9de-79b8159442f5" alt="create new app" width="700"/> -->

3. Enter a name for your web app, then press "Register app."

4. Copy the code shown by clicking on the copy button. Then Click "Continue to console."

5. Now at the top of the page, click on "Service accounts." 

6. Next, click on the "Generate new private key" button. When prompted with the window, press the "Generate key" button. 

7. The generated key will be downloaded as a file to your local computer, in your downloads folder.

8. Find the file, and rename it to "firebase.json" and save the file.

9. On the left side panel, click on "Build" then click on "Authentication."

10. Once on the Authentication page, click "Get started."

11. Now click on the "Email/Password" selection, as shown below.

12. Click on the "Enable" switch and then click on Save.

13. Next, we want to enable Google authentication as well. So click on the "Add new provider" button.

14. Now select the "Google" option in the menu shown.

15. Just like before, click on the "Enable" switch. For the Google provider, it will ask you to provide a support email. Just click on the dropdown list and select anything in the dropdown list. Then click on the "Save" button when you're done.

16. Now click on the "Settings" tab at the top of the page. Click on the "Authorized Domains" menu option. Click on the "Add domain" button. Then type in the following: `127.0.0.1` Then press the "Add" button.

### Github

1. Create a [Github](https://github.com) account, if you have not already.

2. Go to the Ultimafia repository page [here](https://github.com/UltiMafia/Ultimafia).

3. Click on the "Fork" button at the top of the page.

4. Click on the "Create fork" button as shown below.

5. Now you have a copy of the repository that you have on your account. Next, click on the green "Code" button.

6. Next, click on the "Codespaces" tab to switch tabs.

7. Then click on "Create codespace on master" to create a new codespace for your repository.

8. Creating the codespace will open new tab in your browser. As soon as you see the README show up, you can close the new tab, as the codespace is done being created.

9. Once the codespace is created, go back to your repository's page, which you should still have open from the previous tab. Refresh the page to load the fact that the codespace is done being created.

10. Now click on the green "Code" button again, and go the to "Codespaces" tab. You should see that you have a codespace that is "Active."

11. Now open Visual Studio Code on your computer.

12. On the left side menu panel, click on the "Extensions" menu. Then search for then Github Codespaces extension by using the search bar at the top. Then install the Github Codespaces extension by clicking the "Install" button.

13. Then you need to click on the "Remote Explorer" option on the left side menu panel, and then make sure that the dropdown menu at the top is set to "Github Codespaces." Next, click on the "Sign in to Github" button. There should be a Visual Studio Code window that prompts you, just press "Allow." Then a new tab will open in your browser, and it will also prompt you. Just press "Ok" or "Allow."

14. You should now see the codespace that you created in your Remote Explorer menu to the left. Now you can click on the small plug icon next to the name of your codespace in order to connect to it remotely. Now just wait for it to connect remotely, it should load in a few moments.

## Code setup

1. In Visual Studio Code, click on the "Terminal" menu option at the top of the application, then click on "New Terminal."

2. Now type the following in the terminal window that shows up at the bottom of the application, and then press enter: bash totalsetup.sh

3. Follow the prompts that appear in the terminal window.

4. The first thing it asks for is the Firebase configuration. You should still have that code saved to your clipboard from earlier, so pressing Ctrl+V should work.
Visual Studio Code may ask you to enable a setting to allow you to paste things into the console. I can't remember where that setting is now, since I've already enabled it. But it should take you right to the setting as needed. If that does happen, just do what Visual Studio Code says and enable it, then try pasting it in the console again. Keep in mind that you will need to click on the Terminal window at the bottom of the application to shift the focus back to that part of the app, so that you can continue typing in it.

5. If you do not still have the code saved to your clipboard, don't worry you can do the following. If pasting the code worked, then skip to step 6.
If it didn't paste properly, just go to your Firebase console for your project again. You can reach it [here.](https://console.firebase.google.com/u/0/) Click on your project, then click on the gear icon next to "Project Overview" and then scroll down and click on the the "Project settings" option.

6. Once you have pasted the firebase config information specified above, press Ctrl+D twice to go to the next step. The prompt will tell you to generate a private key, which we've already done in this guide. What you should do now is find your firebase.json file that you renamed earlier in the firebase setup, and click and drag it into your root folder for the Ultimafia repository. Drag it to the bottom as shown below, so that the firebase.json file goes into your root folder, and not somewhere else.

7. As the prompt tells you, click in the terminal window at the bottom again and then press Enter when your firebase.json file is copied into the repository.

8. Next the prompt will tell you to add `127.0.0.1` to the authorized domains, which we did in step 16 of the firebase setup. If you have not done that, see that step and follow the instructions. When you are finished, press Enter.

9. Now just wait for the Terminal to build the docker containers and finish loading.

## Development Notes

### Restarting the Backend
In order to restart the server and see any code changes that you have made in Javascript, click on the Terminal menu at the top, then click "Run Task..." A search bar should show up, and you can look for "Restart Backend" and click on that. That should start a task and restart the NodeJS processes running the site's backend code and game code.

### Rebuilding the Frontend
Normally you shouldn't need to, but if you find yourself in a situation where it's necessary, you can rebuild the frontend in a similar way to restarting the backend. There is a task created for rebuilding the frontend in Visual Studio Code as well. Just use the Terminal menu as with restarting the backend, but search for "Rebuild Frontend" instead. This will create a task and open a new terminal window to show you the process of the build. Once the build is done, you can close that terminal window by clicking on the trash icon over on the lower right side next to that terminal window's selection.

### Stopping/Restarting the containers
If for some reason you need to stop or restart your docker containers, you can do so using the same terminal menu as before. Just search "Stop Containers" or "Restart Containers" respectively.

### Debugging
In order to debug the code and hit breakpoints, you can go to the "Run and Debug" option on the left side menu panel, and then at the top of the Run and Debug window, there is a dropdown menu. In the dropdown menu, you will see 3 options that start with Docker. If you are debugging game code, then select the option "Docker: Games" and press the play button. This will launch a debugger, and you can set breakpoints for the debugger to hit. The same process can be used for site code by selecting the "Docker: WWW" option, and for chat code with the "Docker: Chat" option. You can also disconnect your debugger if you no longer need it by looking at the "Call Stack" section of Visual Studio Code, finding your debugger currently running, and clicking on the disconnected plug icon next to the name when you hover your mouse over it.

### Managing your Fork
To ensure that your code is up to date, before making new changes, you should always go to your repository's front page, click on the "Sync Fork" button, and then if your repository is not up to date, then click on the "Sync" button to make sure your repository is up to date with the main repository. This stops you from changing code that may be outdated.

### Committing Code
When writing code, you should almost always be in a new branch, instead of the master branch. To do this, go to the "Source Control" option on the left side menu panel. Then at the top of the Source Control window, click on the three dots to expand a menu, and then select "Branch" and then click on "Create Branch..." Then just type in a branch name. Typically the branch name should be relevant to whatever changes you are making. Visual Studio Code will automatically switch to the new branch you have created. Now make your code changes as usual. Then once you're done, you can stage your changes by coming back to the Source Control window, hover over the "Changes" text at the top of the window, and click on the plus icon (+) to stage your changes. Then simply type a commit message, and then press the "Commit" button or "Publish Branch" button to upload your changes, or upload your new branch, respectively.

### Merging Code
To merge your code into the main repository, so that the changes go to the live site, go to your repository's main page on Github. Now click on the "Pull Requests" option at the top of the page. Now click on the "New pull request" button. At the top of the "Comparing changes" menu, there are 4 dropdown lists. Don't change the first 3. Just focus on the last dropdown list. Use the 4th dropdown list to select the branch with the code you just finished uploading or committing, and click on it. If you have many branches, you may need to use the search box to find it. Then click on the "Create pull request" button. This will create a pull request, and other developers will have to review it first before it is merged. Once it's been reviewed and approved, it will be merged. At this point, congratulations, you've successfully contributed code to Ultimafia.