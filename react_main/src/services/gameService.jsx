import axios from "axios";

export const getRecentlyPlayedSetups = async ({ daysInterval }) => {
  // by default, returns the 1st announcement (no DATE provided in URLfilter)
  try {
    const res = await axios.get(
      `/game/mostPlayedRecently?daysInterval=${daysInterval}`
    );
    return res?.data?.sort((a, b) =>
      a?.count < b?.count ? -1 : a?.count === b?.count ? 0 : 1
    );
  } catch (err) {
    console.log(
      `An error has occurred while fetching the recently played setups...`,
      err
    );
    return null;
  }
};
