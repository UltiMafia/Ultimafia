const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AddHideAndSeek extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addRequiredRole: function (player) {
        if (player != this.player) return;
        if (this.reroll) return;
        this.player.role.data.reroll = true;

        if(this.player.role.name == "Seeker"){
          let players = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Mafia" || p.role.alignment == "Cult") && !p.role.data.reroll);
          let shuffledPlayers = Random.randomizeArray(players);
          for(let x = 0; x < shuffledPlayer.length;x++){
            if(shuffledPlayer[x].role.name == "Hider" || shuffledPlayer[x].role.name == "Invader"){
              return;
            }
          }
          if(shuffledPlayers[0].role.alignment == "Mafia"){
          shuffledPlayers[0].setRole("Hider", undefined, false, true);
          shuffledPlayers[0].data.reroll = true;
          }
          else{
            shuffledPlayers[0].setRole("Invader", undefined, false, true);
            shuffledPlayers[0].data.reroll = true;
          }
        }
        else if(this.player.role.name == "Hider"){
          let players = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Village" || p.role.alignment == "Cult") && !p.role.data.reroll);
          let shuffledPlayers = Random.randomizeArray(players);
          for(let x = 0; x < shuffledPlayer.length;x++){
            if(shuffledPlayer[x].role.name == "Seeker" || shuffledPlayer[x].role.name == "Invader"){
              return;
            }
          }
          if(shuffledPlayers[0].role.alignment == "Village"){
          shuffledPlayers[0].setRole("Seeker", undefined, false, true);
          shuffledPlayers[0].data.reroll = true;
          }
          else{
            shuffledPlayers[0].setRole("Invader", undefined, false, true);
            shuffledPlayers[0].data.reroll = true;
          }
        }
        else if(this.player.role.name == "Invader"){
          let players = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Village" || p.role.alignment == "Mafia") && !p.role.data.reroll);
          let shuffledPlayers = Random.randomizeArray(players);
          for(let x = 0; x < shuffledPlayer.length;x++){
            if(shuffledPlayer[x].role.name == "Seeker" || shuffledPlayer[x].role.name == "Hider"){
              return;
            }
          }
          if(shuffledPlayers[0].role.alignment == "Village"){
          shuffledPlayers[0].setRole("Seeker", undefined, false, true);
            shuffledPlayers[0].data.reroll = true;
          }
          else{
            shuffledPlayers[0].setRole("Hider", undefined, false, true);
            shuffledPlayers[0].data.reroll = true;
          }
        }


    
      },
    };
  }
};
