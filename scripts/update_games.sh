git restore react_main/build;
git pull;
rm -rf react_main/build_public;
cp -r react_main/build react_main/build_public;

pm2 scale games +1 --no-autorestart;
redis-cli publish deprecate $1;
pm2 restart www;