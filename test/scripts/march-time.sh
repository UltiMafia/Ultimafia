#!/bin/bash

current_date=$(date +%Y-%m-%d)
echo "Starting date: $current_date"

if [[ ! -z "$1" ]]; then
    # Advance the date by X days
    current_date=$(date -d "$current_date + $1 day" +%Y-%m-%d)
    sudo date -s "$current_date"
    echo -e "\nDate advanced to: $current_date"
    exit 0
fi

while true; do
    read -n 1 -s -r -p "Press any key to advance to the next day (or 'q' to quit): " key

    if [[ "$key" == "q" ]]; then
        echo -e "\nExiting."
        break
    fi

    # Advance the date by one day
    current_date=$(date -d "$current_date + 1 day" +%Y-%m-%d)
    sudo date -s "$current_date"
    echo -e "\nDate advanced to: $current_date"

    docker exec backend pm2 restart www
    sleep 5
    docker logs -n 10 backend
done
