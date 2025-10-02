const DRY_RUN = false;

const query = { gameType: "Ghost" };
const remappings = {
    'Fool:': 'Sleepwalker:Humble'
};

let updates = {};
const matchedSetups = db.setups.find(query);
for(const setup of matchedSetups)
{
    const roles = JSON.parse(setup.roles);
    let newRoles = [];
    let updateThis = false;
    if(setup.gameType === "Ghost")
    {
        updateThis = true;
    }
    for(const roleset of roles)
    {
        let newRoleset = {...roleset};
        for(const beforeRole of Object.keys(remappings))
        {
            if(roleset[beforeRole] !== undefined)
            {
                updateThis = true;
                const afterRole = remappings[beforeRole];
                print(`Marking ${setup.id} because of role remapping [${beforeRole} ${roleset['Fool:']}] -> [${afterRole})]`);
                newRoleset[afterRole] = roleset[beforeRole];
                delete newRoleset[beforeRole];
            }
        }
        newRoles.push(newRoleset);
    }

    if(updateThis)
    {
        updates[setup.id] = {
            $set: {
                gameType: "Mafia",
                preGhostMigrationRoles: setup.roles,
                roles: JSON.stringify(newRoles),
            }
        };
    }
};

// UPDATE SECTION
for(const updateSetupId of Object.keys(updates))
{
    const operation = DRY_RUN ? "DRY RUN" : "UPDATING";
    print(`=========================== ${operation} ${updateSetupId} ===========================`);
    printjson(updates[updateSetupId]);

    if(!DRY_RUN)
    {
        db.setups.updateOne({ id: updateSetupId }, updates[updateSetupId]);
        const setupAfterChanges = db.setups.findOne({ id: updateSetupId })
        print(`Before: ${setupAfterChanges.preGhostMigrationRoles}`);
        print(`After: ${setupAfterChanges.roles}`);
    }
}

db.games.updateMany(
    { type: "Ghost" },
    [
        {
            $set: {
                type: "Mafia"
            }
        }
    ]
);
