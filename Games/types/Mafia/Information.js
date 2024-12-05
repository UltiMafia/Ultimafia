module.exports = class MafiaInformation{
  constructor(name, creator, game) {
    this.name = name;
    this.creator = creator;
    this.game = game;
    this.mainInfo = true;
  }

  processInfo(){
    if(this.creator != null){
      if(this.creator.hasEffect("TrueMode")){
        if(!this.isTrue()){
          this.makeTrue();
        }
      }
      else if(this.creator.hasEffect("FalseMode")){
          if(!this.isFalse()){
          this.makeFalse();
        }
      }
      else if(this.creator.hasEffect("UnfavorableMode")){
          if(!this.isUnfavorable()){
          this.makeUnfavorable();
        }
      }
      else if(this.creator.hasEffect("FavorableMode")){
          if(!this.isFavorable()){
          this.makeFavorable();
        }
      }
    }
  }

  getInfoRaw(){
    this.game.events.emit("Information",this);
  }

  getInfoFormated(){
    this.game.events.emit("Information",this);
  }

  isTrue() {
    return true;
  }
  isFalse() {
    return false;
  }
  isFavorable(){
    return false;
  }
  isUnfavorable(){
    return true;
  }

  makeTrue() {
  }
  makeFalse() {
  }
  makeFavorable(){
  }
  makeUnfavorable(){
  }
};
