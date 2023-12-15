module.exports = function (type, name) {
  const templates = {
    basic: `${name} was killed.`,
    condemn: `${name} was condemned to the gallows.`,
    leave: `:exit: ${name} left the game.`,
    bleed: `:blood: ${name} has bled to death.`,
    gamble: `${name} didn't bet so good…`,
    veg: `:veg: ${name} turned into a vegetable.`,
    gun: `${name} collapses to the ground from a gunshot wound.`,
    burn: `${name} suddenly lights on fire and burns to a crisp!`,
    poison: `${name} finally succumbs to poison.`,
    condemnRevenge: `${name} was killed in an act of revenge.`,
    bomb: `:bomb: ${name} explodes into a thousand pieces.`,
    curse: `${name} feels a cold chill run down their spine!`,
    blood: `${name} died from a lack of blood.`,
    love: `${name} misses their beloved too much.`,
    famine: `${name} could not survive the famine.`,
    polarised: `${name} was shocked on contact with their polar opposite.`,
    eaten: `${name} was eaten.`,
    mistress: `${name} learned too much about their paramour.`,
    beheading: `${name} was beheaded by the Queen!`,
    drunkDrive: `${name} tried to drive while drunk.`,
    sacrifice: `${name} has sacrificed themself.`,
  };

  return templates[type];
};
