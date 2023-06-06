bash ./update_prep.sh
to_deprecate=`cat to_delete_port`

git restore react_main/build
git pull;

pm2 scale games +1 --no-autorestart;
redis-cli publish deprecate $to_deprecate;
pm2 restart www;
