import axios from "axios";

// TODO: retrieve a batch of Announcements & cache them until page is refreshed (use react-query maybe?). don't DOS your own fukin server + UI becomes better
//       maybe use a MAP, containing current DATE, PREV_ANNOUNCEMENT, NEXT_ANNOUNCEMENT. would be very efficient
export const getAnnouncement = async (URLfilter = "") => {
  // by default, returns the 1st announcement (no DATE provided in URLfilter)
  try {
    const res = await axios.get(`/mod/announcements${URLfilter}`);
    let announcement;
    if (URLfilter.includes("first")) {
      announcement = res?.data?.pop();
    } else {
      announcement = res?.data?.[0];
    }

    return announcement;
  } catch (err) {
    console.log(
      `An error has occurred while fetching the latest announcement...`,
      err
    );
    return null;
  }
};
export const getPrevAnnouncement = (currentAnnouncementDate) =>
  getAnnouncement(`?first=${currentAnnouncementDate}`);
export const getNextAnnouncement = (currentAnnouncementDate) =>
  getAnnouncement(`?last=${currentAnnouncementDate}`);

export const isFirstAnnouncement = async (announcement) => {
  const prevAnnouncement = await getPrevAnnouncement(announcement?.date);
  return !!prevAnnouncement;
};
export const isLastAnnouncement = async (announcement) => {
  const nextAnnouncement = await getNextAnnouncement(announcement?.date);
  return !!nextAnnouncement;
};
