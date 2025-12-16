const Item = require("../Item");
const {
  PRIORITY_MODIFY_ACTION,
  MEETING_PRIORITY_JAIL,
} = require("../const/Priority");
const Random = require("../../../../lib/Random");
const painPool = ["Volcano"];
const garbagePool = [
  "Boot",
  "Boot",
  "Boot",
  "Tin Can",
  "Tin Can",
  "Broken Item",
  "Broken Item",
  "Broken Item",
  "Broken Item",
];
const itemPool = [
  "Gun",
  "Gun",
  "Armor",
  "Armor",
  "Knife",
  "Knife",
  "Falcon",
  "Bomb",
  "Syringe",
  "Shield",
  "Shield",
  "Shield",
  "Key",
  "Key",
  "Key",
  "Key",
  "Key",
  "Crystal Ball",
  "Crystal Ball",
];
const fishPool = [
  "Trout",
  "Trout",
  "Trout",
  "Trout",
  "Trout",
  "Trout",
  "Trout",
  "Trout",
  "Bass",
  "Bass",
  "Bass",
  "Bass",
  "Bass",
  "Bass",
  "Bass",
  "Bass",
  "Black Swallower",
  "Black Swallower",
  "Black Triggerfish",
  "Black Triggerfish",
  "Blobfish",
  "Blodfish",
  "Blue Triggerfish",
  "Blue Triggerfish",
  "Bluefin Tuna",
  "Carp",
  "Carp",
  "Carp",
  "Catfish",
  "Catfish",
  "Clownfish",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Cod",
  "Combtooth Blenny",
  "Combtooth Blenny",
  "Chubsucker",
  "Chubsucker",
  "Cutlassfish",
  "Cutlassfish",
  "Cutthroat Trout",
  "Cutthroat trout",
  "Cutthroat trout",
  "Dab",
  "Dab",
  "Daggertooth Pike Conger",
  "Daggertooth Pike Conger",
  "Daggertooth Pike Conger",
  "Damselfish",
  "Damselfish",
  "Dartfish",
  "Dartfish",
  "Death Valley Pupfish",
  "Death Valley Pupfish",
  "Spiny Dogfish",
  "Dottyback",
  "Eeltail Catfish",
  "Eeltail Catfish",
  "Eeltail Catfish",
  "Emperor Angelfish",
  "European Chub",
  "Eurasian Minnow",
  "Flagfin",
  "Flounder",
  "Footballfish",
  "Flathead Catfish",
  "Flathead Catfish",
  "Galjoen Fish",
  "Great White Shark",
  "Goblin Shark",
  "Goldfish",
  "Hagfish",
  "Hog Sucker",
  "Red Herring",
];
const winPool = ["GoldenCarp"];

module.exports = class FishingRod extends Item {
  constructor() {
    super("Fishing Rod");

    this.meetings = {
      "Go Fishing": {
        actionName: "Go Fishing",
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        item: this,
        action: {
          labels: ["hidden"],
          priority: PRIORITY_MODIFY_ACTION,
          item: this,
          run: function () {
            if (this.target == "Yes") {
              this.actor.data.GoneFishin = true;
              this.item.GoneFishin = true;
            } else {
              this.actor.data.GoneFishin = false;
              this.item.GoneFishin = false;
            }
          },
        },
      },
      Lake: {
        states: ["Day"],
        flags: ["speech", "group"],
        item: this,
        shouldMeet() {
          return this.player.data.GoneFishin == true;
        },
      },
      Fish: {
        states: ["Day"],
        flags: [
          "voting",
          "instant",
          "instantButChangeable",
          "repeatable",
          "noVeg",
        ],
        item: this,
        inputType: "custom",
        targets: ["Fish", "Not Fish"],
        shouldMeet() {
          return this.player.data.GoneFishin == true;
        },
        action: {
          run: function () {
            if (this.target == "Fish") {
              let fishingValue = Random.randInt(1, 250);
              if (fishingValue == 1) {
                let fish = Random.randArrayVal(painPool);
                if (fish == "Volcano") {
                  this.game.queueAlert(
                    `${this.actor.name} disturbed an underwater volcano when fishing. VOLCANO IS ERUPTING! SOMEONE WILL BE HIT WITH MOLTEN ROCK EVERY 30 SECONDS UNTIL THE DAY ENDS!`
                  );
                  this.actor.giveEffect("Volcanic", -1);
                  this.game.events.emit("Volcano");
                }
              } else if (fishingValue <= 50) {
                let fish = Random.randArrayVal(garbagePool);
                if (fish == "Broken Item") {
                  fish = Random.randArrayVal(itemPool);
                  this.actor.holdItem(fish, { broken: true });
                  this.actor.queueGetItemAlert(fish);
                } else {
                  this.actor.holdItem("Garbage", fish);
                  this.actor.queueGetItemAlert(fish);
                }
              } else if (fishingValue <= 225) {
                let fish = Random.randArrayVal(fishPool);
                this.actor.holdItem("Food", fish);
                this.actor.queueGetItemAlert(fish);
              } else if (fishingValue <= 247) {
                let fish = Random.randArrayVal(itemPool);
                this.actor.holdItem(fish);
                this.actor.queueGetItemAlert(fish);
              } else {
                let fish = Random.randArrayVal(winPool);
                this.actor.holdItem(fish);
                this.actor.queueGetItemAlert(fish);
              }
            }
          },
        },
      },
    };
  }

  shouldDisableMeeting(name) {
    // do not disable jailing, gov actions
    if (this.game.getStateName() != "Day") {
      return false;
    }
    if (this.GoneFishin != true) {
      return false;
    }
    if (name == "Lake") {
      return false;
    }
    if (name == "Fish") {
      return false;
    }

    return true;
  }
};
