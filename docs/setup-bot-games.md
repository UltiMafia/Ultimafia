# Setting up Bot Games

## Add `dev` property to your user

1. Enter the mongo shell via `mongosh`.

```
docker exec -it mongo mongosh
```

2. Authenticate as admin.

```
test> use admin
switched to db admin

admin> db.auth('admin', passwordPrompt())
Enter password
********{ ok: 1 }

admin>
```

3. Enter the beyondmafia db (`$MONGO_DB`).

```
admin> use beyondmafia
switched to db beyondmafia
```

5. Add the dev property to your user.

```
beyondmafia> db.users.updateOne(
    { name: '<username>' },
    { $set: {dev: 'true'} })

{
  acknowledged: true,
  modifiedCount: 1
}
```

6. Check that your user has the dev property.

```
beyondmafia> db.users.find({}, {name:1, dev:1})
[
  {
    _id: ObjectId('XXX'),
    name: '<username>',
    dev: 'true'
  }
]
```

If you're interested, the property is checked [here](https://github.com/r3ndd/BeyondMafia-Integration/blob/master/Games/core/Game.js#L534).

#### (Optional) Set as Owner

Owner permissions are not needed for testing roles but it will come in handy to test other site functions like forum and chat.

1. Get your user ObjectId.

```
beyondmafia> db.users.find({}, {name:1})
```

2. Get the group ObjectId.

```
beyondmafia> db.groups.find({name:'Owner'}, {name:1})
```

3. Add the group mapping.

```
beyondmafia> db.ingroups.insertOne(
  {
    user: ObjectId("6XXXuserId"),
    group: ObjectId("6YYYgroupId")
  })
```

## Testing games with bots

1. Create and host a setup.

2. A test tube icon appears in the top bar.

![test tube](https://user-images.githubusercontent.com/24848927/212348802-56db2540-5b3d-4c72-8182-3ab883eed99c.png)

3. Click the test tube icon and bot accounts will spawn in new windows.
