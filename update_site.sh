bash ./update_prep.sh

git pull;

pm2 scale games +1 --no-autorestart;

while read port; do
  redis-cli publish deprecate $port;
  echo $port
done < to_delete_port
rm to_delete_port

sleep 2;
pm2 restart www chat;
