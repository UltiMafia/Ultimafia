import villagerIcon from "images/roles/village/villager-vivid.png";
import doctorIcon from "images/roles/village/doctor-vivid.png";
import copIcon from "images/roles/village/cop-vivid.png";
import sheriffIcon from "images/roles/village/sheriff-vivid.png";
import stalkerIcon from "images/roles/mafia/stalker-vivid.png";
import seerIcon from "images/roles/village/seer-vivid.png";

export const DEFAULT_MU = 25;
export const DEFAULT_SIGMA = 25 / 3;

export const TIER_ICONS = {
  Master: seerIcon,
  Diamond: stalkerIcon,
  Platinum: sheriffIcon,
  Gold: copIcon,
  Silver: doctorIcon,
  Bronze: villagerIcon,
  Unrated: villagerIcon,
};

export function getConservativeRank(mu, sigma, decimals = 2) {
  return ((mu || DEFAULT_MU) - 3 * (sigma || DEFAULT_SIGMA)).toFixed(decimals);
}

// Re-export individual icons for consumers that need them directly
export {
  villagerIcon,
  doctorIcon,
  copIcon,
  sheriffIcon,
  stalkerIcon,
  seerIcon,
};
