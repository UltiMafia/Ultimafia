import masterIcon from "images/tiers/master.png";
import diamondIcon from "images/tiers/diamond.png";
import platinumIcon from "images/tiers/platinum.png";
import goldIcon from "images/tiers/gold.png";
import silverIcon from "images/tiers/silver.png";
import bronzeIcon from "images/tiers/bronze.png";
import unratedIcon from "images/tiers/unrated.png";

export const DEFAULT_MU = 25;
export const DEFAULT_SIGMA = 25 / 3;

export const TIER_ICONS = {
  Master: masterIcon,
  Diamond: diamondIcon,
  Platinum: platinumIcon,
  Gold: goldIcon,
  Silver: silverIcon,
  Bronze: bronzeIcon,
  Unrated: unratedIcon,
};

export function getConservativeRank(mu, sigma, decimals = 2) {
  return ((mu || DEFAULT_MU) - 3 * (sigma || DEFAULT_SIGMA)).toFixed(decimals);
}
