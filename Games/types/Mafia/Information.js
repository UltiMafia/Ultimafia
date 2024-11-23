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
    return true;
  }

  getInfoFormated(){
    return `You Learn ${this.getInfoRaw()}`
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
