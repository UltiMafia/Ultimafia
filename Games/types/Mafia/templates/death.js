module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    condemn: `${name} was executed by the village.`,
    leave: `:sy9e: ${name} left the game.`,
    bleed: `:sy1b: ${name} has bled to death.`,
    veg: `:sy9d: ${name} turned into a vegetable.`,
    gun: `${name} collapses to the ground from a gunshot wound.`,
    burn: `${name} suddenly lights on fire and burns to a crisp!`,
    poison: `${name} finally succumbs to poison.`,
    condemnRevenge: `${name} was killed in an act of revenge.`,
    bomb: `${name} explodes into a thousand pieces.`,
    curse: `${name} feels a cold chill run down their spine!`,
    blood: `${name} died from a lack of blood.`,
    love: `${name} misses their beloved too much.`,
    famine: `${name} could not survive the famine.`,
    polarised: `${name} met another polarised player.`,
    eaten: `${name} was eaten.`,
    bluebeard: `${name} learned too much about Bluebeard.`,
    drunkDrive: `${name} tried to drive while drunk.`,
    drunkCycle: `${name} tried to cycle while drunk.`,
  };

  return templates[type];
};
