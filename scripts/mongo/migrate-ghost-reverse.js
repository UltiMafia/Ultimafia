const DRY_RUN = false;

// Use the query object to selectively limit the affected setups to almost any mongo field.
const query = { gameType: "Mafia" };
// For specifically the roles field, use this filter function to selectively apply the remappings
const roleFilter = function(setup)
{
    for(const roleset of setup.roles)
    {
        for(role of Object.keys(roleset))
        {
            if(role === "Ghost")
            {
                // Return true if and only if the setup contains a ghost
                print(`Matched ${setup.id}`);
                return true;
            }
        }
    }
    return false;
}

const remappings = {
    'Sleepwalker:Humble': 'Fool:'
};

let updates = {};
const matchedSetups = db.setups.find(query);
for(const setup of matchedSetups)
{
    const roles = JSON.parse(setup.roles);
    let newRoles = [];
    let updateThis = false;
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
                roles: JSON.stringify(newRoles),
                gameType: "Ghost",
            },
            $unset: {
                preGhostMigrationRoles: "",
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
