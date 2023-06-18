# Setting up the Development Environment: Docker Guide for MongoDB and Redis

There are many ways you can bootstrap MongoDB and Redis locally. This method runs MongoDB and Redis in containers. Prerequisite: [docker](https://docs.docker.com/get-docker/).

## MongoDB

1. Run the mongo container.

```
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password -v local-mongo:/data/db --name mongo --restart=always mongo
```

2. Enter the mongo shell.

```
docker exec -it mongo mongosh
```

3. Authenticate as admin.

```
test> use admin
switched to db admin

admin> db.auth('admin', passwordPrompt())
Enter password
********{ ok: 1 }

admin>
```

4. Create a database.

```
admin> use ultimafia
switched to db ultimafia

ultimafia> exit
```

5. Fill in the `.env` for the backend.

```
MONGO_URL=localhost
MONGO_DB=ultimafia
MONGO_USER=admin
MONGO_PW=password
```

## Redis

```
docker run -d -p 6379:6379 --name redis --restart=always redis
```
