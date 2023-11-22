echo "Welcome to the Ultimafia complete setup!"
echo "----------------------------------------"

echo "Enter a username for your MongoDB admin account, or enter nothing to keep default: "
read adminName

echo "Enter a password for your MongoDB admin account, or enter nothing to keep default: "
read adminPass

echo "Enter a name for your MongoDB database, or enter nothing to keep default: "
read dbName

if [[ $adminName == "" ]]; then
    adminName="admin"
fi

if [[ $adminPass == "" ]]; then
    adminPass="password"
fi

if [[ $dbName == "" ]]; then
    dbName="ultimafia"
fi

cp ./docs/client_env ./react_main/.env
cp ./docs/server_env ./.env

mongoUser="MONGO_USER=admin"
mongoUserRep="MONGO_USER=$adminName"
sed -i "s/$mongoUser/$mongoUserRep/" "./.env"

mongoPass="MONGO_PW=password"
mongoPassRep="MONGO_PW=$adminPass"
sed -i "s/$mongoPass/$mongoPassRep/" "./.env"

mongoDBName="MONGO_DB=ultimafia"
mongoDBNameRep="MONGO_DB=$dbName"
sed -i "s/$mongoDBName/$mongoDBNameRep/" "./.env"
echo "--------------------------------------"
echo "Great! If you have not done so yet, go and set up your Firebase."

echo "Once that is done, please enter your Firebase code (press Ctrl+D TWICE when done): "
js_code=$(cat)

# Extract values using grep and awk
apiKey=$(echo "$js_code" | grep -o 'apiKey: ".*"' | awk -F '"' '{print $2}')
authDomain=$(echo "$js_code" | grep -o 'authDomain: ".*"' | awk -F '"' '{print $2}')
projectId=$(echo "$js_code" | grep -o 'projectId: ".*"' | awk -F '"' '{print $2}')
storageBucket=$(echo "$js_code" | grep -o 'storageBucket: ".*"' | awk -F '"' '{print $2}')
messagingSenderId=$(echo "$js_code" | grep -o 'messagingSenderId: ".*"' | awk -F '"' '{print $2}')
appId=$(echo "$js_code" | grep -o 'appId: ".*"' | awk -F '"' '{print $2}')
measurementId=$(echo "$js_code" | grep -o 'measurementId: ".*"' | awk -F '"' '{print $2}')

backFbKey="FIREBASE_API_KEY=x"
backFbKeyRep="FIREBASE_API_KEY=$apiKey"
sed -i "s/$backFbKey/$backFbKeyRep/" "./.env"

backFbAuthD="FIREBASE_AUTH_DOMAIN=x.firebaseapp.com"
backFbAuthDRep="FIREBASE_AUTH_DOMAIN=$authDomain"
sed -i "s/$backFbAuthD/$backFbAuthDRep/" "./.env"

backFbProjId="FIREBASE_PROJECT_ID=x"
backFbProjIdRep="FIREBASE_PROJECT_ID=$projectId"
sed -i "s/$backFbProjId/$backFbProjIdRep/" "./.env"

backFbMsgId="FIREBASE_MESSAGING_SENDER_ID=x"
backFbMsgIdRep="FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId"
sed -i "s/$backFbMsgId/$backFbMsgIdRep/" "./.env"

backFbAppId="FIREBASE_APP_ID=x"
backFbAppIdRep="FIREBASE_APP_ID=$appId"
sed -i "s/$backFbAppId/$backFbAppIdRep/" "./.env"

backFbMeasureId="FIREBASE_MEASUREMENT_ID=x"
backFbMeasureIdRep="FIREBASE_MEASUREMENT_ID=$measurementId"
sed -i "s/$backFbMeasureId/$backFbMeasureIdRep/" "./.env"
#-----------------------------------------------------------------
frontFbKey="REACT_APP_FIREBASE_API_KEY=x"
frontFbKeyRep="REACT_APP_FIREBASE_API_KEY=$apiKey"
sed -i "s/$frontFbKey/$frontFbKeyRep/" "./react_main/.env"

frontFbAuthD="REACT_APP_FIREBASE_AUTH_DOMAIN=x.firebaseapp.com"
frontFbAuthDRep="REACT_APP_FIREBASE_AUTH_DOMAIN=$authDomain"
sed -i "s/$frontFbAuthD/$frontFbAuthDRep/" "./react_main/.env"

frontFbProjId="REACT_APP_FIREBASE_PROJECT_ID=x"
frontFbProjIdRep="REACT_APP_FIREBASE_PROJECT_ID=$projectId"
sed -i "s/$frontFbProjId/$frontFbProjIdRep/" "./react_main/.env"

frontFbMsgId="REACT_APP_FIREBASE_MESSAGING_SENDER_ID=x"
frontFbMsgIdRep="REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId"
sed -i "s/$frontFbMsgId/$frontFbMsgIdRep/" "./react_main/.env"

frontFbAppId="REACT_APP_FIREBASE_APP_ID=x"
frontFbAppIdRep="REACT_APP_FIREBASE_APP_ID=$appId"
sed -i "s/$frontFbAppId/$frontFbAppIdRep/" "./react_main/.env"

frontFbMeasureId="REACT_APP_FIREBASE_MEASUREMENT_ID=x"
frontFbMeasureIdRep="REACT_APP_FIREBASE_MEASUREMENT_ID=$measurementId"
sed -i "s/$frontFbMeasureId/$frontFbMeasureIdRep/" "./react_main/.env"

frontFbStorageB="REACT_APP_FIREBASE_STORAGE_BUCKET=x.appspot.com"
frontFbStorageBRep="REACT_APP_FIREBASE_STORAGE_BUCKET=$storageBucket"
sed -i "s/$frontFbStorageB/$frontFbStorageBRep/" "./react_main/.env"

echo "Now check the firebase console, go to Project settings (gear icon)"
echo "Then click on the 'Service Accounts' tab, and click on the 'Generate new Private key' button"
echo "rename that file to firebase.json, and copy it into your Ultimafia directory."
echo "Press Enter when you are done."
read endVar

echo "Make sure your firebase project has authentication setup"
echo "Also make sure that it has both EMAIL and GOOGLE providers enabled"
echo "Lastly, for signing in to your page, go to:"
echo "Authentication -> Settings -> Authorized Domains"
echo "Then add: 127.0.0.1 to the list of Authorized domains, and save it."
echo "Press Enter when you are done."
read endVar

echo "Great! Now the rest of this should be automatic... please wait..."

export NVM_DIR=~/nvm;
source $NVM_DIR/nvm.sh;

nvm install 14.15.1
nvm use 14.15.1

echo "Is this your first time setup? (Y/N)"
read firstTime

if [ $firstTime=="Y" ] || [ $firstTime=="y" ]; then 
    docker-compose up --build
else
    docker-compose up
fi