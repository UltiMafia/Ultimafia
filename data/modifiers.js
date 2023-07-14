const modifierData = {
    "Mafia": {
        "Armed": {
            internal: ["StartWithGun"],
            description: "Starts with a gun."
        },
        "Explosive": {
            internal: ["StartWithBomb"],
            description: "Starts with a bomb."
        },
        "Armored": {
            internal: ["StartWithArmor"],
            description: "Starts with armor."
        },
        "Exposed": {
            internal: ["PublicReveal"],
            description: "Starts revealed to everyone."
        },
        "Chameleon": {
            internal: ["VillagerToInvestigative"],
            description: "Appears as a Villager to investigative roles."
        },
        "Humble": {
            internal: ["Humble"],
            description: "Appears as Villager to self with no modifier."
        },
        "Scatterbrained": {
            internal: ["Scatterbrained"],
            description: "Appears as Visitor (Village) / Trespasser (Mafia) / Fool (Independent) / Magikarp (Monster) to self with no modifier."
        },
        "Lone": {
            internal: ["Lone"],
            description: "Does not attend the Mafia/Monsters/Cop/Templar meeting."
        },
        "Solitary": {
            internal: ["Solitary"],
            description: "Same as lone (backwards compatibility)."
        },
        "Delayed": {
            internal: ["Delayed"],
            description: "Cannot attend secondary meetings for the first day and night."
        },
        "Even": {
            internal: ["Even"],
            description: "Can only attend secondary meetings on even days and nights.",
            incompatible: ["Odd", "One Shot", "Infinite"]
        },
        "Odd": {
            internal: ["Odd"],
            description: "Can only attend secondary meetings on odd days and nights.",
            incompatible: ["Even", "One Shot", "Infinite"]
        },
        "One Shot": {
            internal: ["OneShot"],
            description: "Can only perform actions once.",
            incompatible: ["Even", "Odd", "Infinite"]
        },
        "Infinite": {
            internal: ["Infinite"],
            description: "Can perform actions indefinitely.",
            incompatible: ["Even", "Odd", "One Shot"]
        },
        "Union": {
            internal: ["WinWithUnion"],
            alignment: "Independent",
            description: "Attends a meeting and wins if the alive union members outnumber the others."
        },
        "Family": {
            internal: ["WinWithFamily"],
            alignment: "Independent",
            description: "Attends a killing meeting and wins if the alive family members outnumber the others."
        },
        "Good": {
            internal: ["VillageAlign"],
            alignment: "Village",
            description: "Is aligned and wins with village."
        },
        "Bad": {
            internal: ["MafiaAlign"],
            alignment: "Mafia",
            description: "Is aligned and wins with mafia."
        },
        "Crook": {
            internal: ["MafiaKillAlign"],
            alignment: "Mafia",
            description: "Is aligned and wins with mafia. Attends Mafia meeting."
        },
        "Undecided": {
            internal: ["IndependentAlign"],
            alignment: "Independent",
            description: "Is Independent, wins if among last two alive."
        },
        "Bloodthirsty": {
            internal: ["Bloodthirsty"],
            description: "Needs to kill other players to stay alive."
        },
        "Loud": {
            internal: ["Loud"],
            description: "All reports received are announced to everyone, with the player's role revealed."
        },
        "Astral": {
            internal: ["Astral"],
            description: "All actions done by this player do not appear as visits."
        },
        "Unblockable": {
            internal: ["Unblockable"],
            description: "All actions done by this player cannot be roleblocked or controlled."
        }
    },
    "Split Decision": {},
    Resistance: {},
    "One Night": {},
    Ghost: {},
    Jotto: {},
    Acrotopia: {},
    "Secret Hitler": {},
}

module.exports = modifierData;