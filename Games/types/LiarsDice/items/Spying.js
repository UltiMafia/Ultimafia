const Item = require("../Item");

module.exports = class Spying extends Item {
  constructor() {
    super("Spying");
    this.meetings = {
      Spy: {
        actionName: "Learn Most Common Dice",
        states: ["Guess Dice"],
        inputType: "boolean",
        flags: ["voting", "instant", "noVeg"],
        action: {
          item: this,
          run: function () {
            if (this.target === "No") return;
            this.item.drop();

            let info = [];
            let count1 = 0;
            let count2 = 0;
            let count3 = 0;
            let count4 = 0;
            let count5 = 0;
            let count6 = 0;
            for(let player of this.game.players){
              for(let dice of player.rolledDice){
                if (dice == 1) {
                count1++;
              }
              if (dice == 2) {
                count2++;
              }
              if (dice == 3) {
                count3++;
              }
              if (dice == 4) {
                count4++;
              }
              if (dice == 5) {
                count5++;
              }
              if (dice == 6) {
                count6++;
              }
              }
            }
            let array = [count1, count2, count3, count4, count5, count6];
            let largest = -1;
            let tie = [];
            for(let x = 0; x < array.length){
              if(array [x] > largest){
                tie = [];
                largest = array [x];
                tie.push(x);
              }
              else if(array [x] == largest){
                tie.push(x);
              }  
            }
            
            for (let num of tie) {
              if ((num+1) == 1) {
                info.push(":Dice1:");
              }
              if ((num+1) == 2) {
                info.push(":Dice2:");
              }
              if ((num+1) == 3) {
                info.push(":Dice3:");
              }
              if ((num+1) == 4) {
                info.push(":Dice4:");
              }
              if ((num+1) == 5) {
                info.push(":Dice5:");
              }
              if ((num+1) == 6) {
                info.push(":Dice6:");
              }
            }

            this.actor.queueAlert(
              `:invest: The Most Common Dice is ${info.join(" ")}`
            );
          },
        },
      },
    };
  }
};
