#!/usr/bin/bash

__repo=$(git rev-parse --show-toplevel)

# Default values
VERBOSE=false
CONNECTION_URI="mongodb://admin:password@localhost:27017/"

# Parse options
while getopts "vo:" opt; do
    case "$opt" in
        v)
            VERBOSE=true
            ;;
        o)
            CONNECTION_URI="$OPTARG"
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

# Shift positional parameters to remove parsed options
shift $((OPTIND - 1))

# Access remaining positional arguments
ARG1="$1"
ARG2="$2"

echo "CONNECTION_URI: $CONNECTION_URI"

dump_dir="${__repo}/dumps"
if [[ ! -z ${dump_dir} ]]; then
    mkdir ${dump_dir}
fi

now=$(date '+%Y-%m-%dT%H:%M:%S')
container_dump_dir="/tempdump"
container_dump_tar="/dump-${now}.tar.gz"
docker exec mongodb mongodump --uri ${CONNECTION_URI} -o ${container_dump_dir}
docker exec mongodb tar -czvf ${container_dump_tar} ${container_dump_dir}
docker cp mongodb:${container_dump_tar} ${dump_dir}/
docker exec mongodb rm -rf ${container_dump_dir}
