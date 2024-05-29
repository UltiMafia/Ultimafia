#!/usr/bin/bash

echo "Clearing root folder of node dependencies..."
cd /workspaces/Ultimafia
npm cache clean --force
rm -r node_modules/
rm package-lock.json

echo "Clearing react_main folder of node dependencies..."
cd react_main
rm -r node_modules/
rm -r build_public/
rm package-lock.json

echo "Cleaning up docker containers, images, and volumes..."
docker stop `docker ps -qa` > /dev/null 2>&1; ## Stop all running containers
docker system prune --volumes --all; ## Remove all unused docker components
docker volume prune --all
