# Role identities

The game engine uses a serializable role descriptor, separate from the live
`Role` instance and from a player's mutable held inventory:

```js
{
  name: "Villager",
  modifiers: ["Retired"],
  items: ["Gun", { type: "Armor", args: [] }]
}
```

`items` contains **additional starting-item definitions**, not live item
instances. Native role/card starting items are still initialized normally.
Copying a descriptor copies definitions, not item IDs, holders, listeners,
or the contents of `role.data`. The existing separate `roleData` argument to
`setRole` retains its meaning. The existing `NoStartingItems` option suppresses
both native and custom starting items.

Public setup input accepts catalog item labels and their internal aliases.
Validation resolves labels such as `Crystal Ball` and `Yuzu Orange` to their
whitelisted import types (`CrystalBall` and `Orange`), preserving item arguments
and merging alias-equivalent counted entries only within their original group.

Use `Role.toRoleData()` for a snapshot of a live role's identity. Use
`normalizeRole`, `roleWith`, and `roleEquals` from `lib/roleIdentity.js` instead
of rebuilding `${name}:${modifier}` or comparing descriptor references. Identity
includes custom items and their arguments; equal names and modifiers alone do
not imply equal setup entries. Mutable descriptors must not be shared between
players or the setup's original-role snapshots.

## Setup persistence

`Setup.roles` retains its JSON string envelope for compatibility with the
existing database field. **The JSON contents are now object entries, not maps
whose string keys contain all role data:**

```json
[
  [
    {"role":{"name":"Villager","modifiers":[],"items":["Gun"]},"count":1},
    {"role":{"name":"Villager","modifiers":[],"items":["Armor"]},"count":1},
    {"role":{"name":"Mafioso","modifiers":[],"items":[]},"count":1}
  ]
]
```

The outer array preserves setup alternatives/role groups. The inner array
contains counted entries. Deduplication applies only to exact identities within
one group; it must not merge different inventories or flatten group boundaries.

Old JSON count maps remain readable. New saves use object entries; existing
setups need no mandatory bulk migration or production rewrite. Duplicate-setup
hashing retains the legacy canonical map representation, independently of the
new storage envelope. Deploy readers and writers together. Do not run old
role/modifier migration scripts on the new representation without adapting their
map-based readers and preserving items.

## Compatibility boundaries

Existing web clients and stored review/history consumers still use serialized
role keys. `roleKey` is the explicit adapter for those boundaries and for
JavaScript count-map keys, not an internal role object replacement:

- Without custom items: `Villager:Retired` (legacy modifier syntax).
- With custom items: `Villager:Retired:["Gun","Armor"]`.
- The old proposed comma inventory suffix (`Villager:Retired:Gun,Armor`) is
  accepted on input and normalized before being written again.

The JSON inventory suffix is deliberate: item arguments may themselves contain
colons or commas. Never use `split(":")[2]` or rebuild the first two segments to
copy an identity. Appearance strings remain presentation data and must not
reveal hidden role identity/inventory just because the internal representation
has richer fields.

`toRoleGroups` decodes persisted/legacy input. `toRoleMaps` and
`serializeRoleMaps` are compatibility adapters for old setup readers. Setup API
responses retain the old map-based wire contract while persistence uses object
entries. This change does not add a new inventory editor; editing role modifiers
in the existing setup editor preserves inventory metadata already present.

`roleStatsKey` is the statistics boundary adapter. Roles without custom items
retain their exact historical `name[:modifier]` buckets. Custom inventories use
the complete canonical identity with percent, dot, and dollar characters escaped
injectively for MongoDB dotted update paths. Granular per-role statistics can
therefore distinguish inventories and arguments without splitting existing
vanilla/modifier buckets. Base-name and alignment aggregates keep their existing
meaning.

## Verification

With isolated MongoDB/Redis configured and dependencies installed, run the
focused regression suite with:

```sh
npm run test:role-objects
```

Identity unit tests cover canonicalization, inventory distinction, nested item
arguments, defensive copies, malformed input, and group/count round trips.
Engine tests cover assignment, role snapshots, conversion/copy paths, and legacy
history/wire adapters. Setup tests cover object persistence and legacy reads.

Tests that instantiate `Game` need isolated MongoDB and Redis. Some existing
tests call `flushdb`; never run them against an operator's development database.
Set `NODE_ENV=test`, `GAME_PORT=0`, a dedicated `MONGO_DB`, and an isolated Redis
service before loading the engine. Run game files in separate processes when
comparing regressions: several existing files retain games/timers or mutate
shared prototypes, so a single suite can obscure individual results.
