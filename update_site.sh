bash ./update_prep.sh

git pull;

docker compose -f docker-compose-core.yml -f docker-compose-prod.yml build nginx

docker exec -it backend pm2 scale games +1 --no-autorestart --watch false;

while read port; do
  docker exec -it redis redis-cli publish deprecate $port;
  echo $port
done < to_delete_port
rm to_delete_port

sleep 2;
docker exec -it backend pm2 restart www chat --watch false;
