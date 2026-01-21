import React, { useEffect, useState } from "react";
import { Alert, Box, IconButton, Stack } from "@mui/material";
import {
  getAnnouncement,
  getPrevAnnouncement,
  getNextAnnouncement,
  isFirstAnnouncement,
  isLastAnnouncement,
} from "../../services/announcementService";
import { Loading } from "./Loading";
import { minimumLoadingTime } from "../../Constants";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { urlifyText } from "../../utilsFolder";

export const Announcement = ({
  showAnnouncementTemporarily,
  setShowAnnouncementTemporarily,
}) => {
  const [seenAnnouncement, setSeenAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(true); // BUG: if there's only 1 announcement, NEXT_BUTTON should be disabled
  const [loadingFirstTime, setLoadingFirstTime] = useState(true);
  const [loading, setLoading] = useState(true);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    (async () => {
      const firstAnnouncement = await getAnnouncement();
      const lastSeenAnnouncementDate = localStorage.getItem(
        "lastSeenAnnouncementDate"
      );

      setSeenAnnouncement(lastSeenAnnouncementDate == firstAnnouncement?.date);
      setAnnouncement(firstAnnouncement);
      setLoading(false);
      setLoadingFirstTime(false);
    })();
  }, []);

  if (loadingFirstTime) {
    return "";
  }
  if (seenAnnouncement && !showAnnouncementTemporarily) {
    return "";
  }
  if (!announcement) {
    return "";
  }

  const stopLoading = () =>
    setTimeout(() => setLoading(false), minimumLoadingTime);
  const closeAnnouncements = () => {
    localStorage.setItem("lastSeenAnnouncementDate", announcement?.date);
    setSeenAnnouncement(true);
    setShowAnnouncementTemporarily(false);
  };
  const showPrevAnnouncement = async () => {
    setLoading(true);
    const newAnnouncement = await getPrevAnnouncement(announcement?.date);
    const newShowPrevButton = await isFirstAnnouncement(newAnnouncement);

    setShowNextButton(true);
    setShowPrevButton(newShowPrevButton);
    setAnnouncement(newAnnouncement);
    stopLoading();
  };
  const showNextAnnouncement = async () => {
    setLoading(true);
    const newAnnouncement = await getNextAnnouncement(announcement?.date);
    const newShowNextButton = await isLastAnnouncement(newAnnouncement);

    setShowPrevButton(true);
    setShowNextButton(newShowNextButton);
    setAnnouncement(newAnnouncement);
    stopLoading();
  };
  const CloseButton = (
    <Box onClick={closeAnnouncements} sx={{ ml: -1, mt: -0.5 }}>
      <IconButton color="info" sx={{ p: 0.5 }}>
        <i className="far fa-times-circle"></i>
      </IconButton>
    </Box>
  );

  // const ScrollButtonsWidth = 35;
  const iconHeight = 15; // default: 20px
  const PrevButton = (
    <IconButton
      disabled={loading || !showPrevButton}
      color="info"
      sx={{ width: `${iconHeight + 8}px`, p: 0.5 }}
      onClick={showPrevAnnouncement}
    >
      <i
        className="fas fa-angle-up"
        style={{ fontSize: `${iconHeight}px` }}
      ></i>
    </IconButton>
  );
  const NextButton = (
    <IconButton
      disabled={loading || !showNextButton}
      color="info"
      sx={{ width: `${iconHeight + 8}px`, p: 0.5 }}
      onClick={showNextAnnouncement}
    >
      <i
        className="fas fa-angle-down"
        style={{ fontSize: `${iconHeight}px` }}
      ></i>
    </IconButton>
  );
  const ScrollButtons = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        mr: 0.5,
        mt: 0.5,
        ml: -4,
        // ml: `-${ScrollButtonsWidth}px`,
      }}
    >
      {PrevButton}
      {NextButton}
    </Box>
  );

  const content = loading ? (
    <div
      style={{
        maxHeight: "20px" /* MAGIC NUMBER WARNING... CSS demands sacrifices */,
      }}
    >
      <Loading extraSmall />
    </div>
  ) : (
    urlifyText(announcement?.content)
  );

  return (
    <Stack direction="row" spacing={1}>
      {ScrollButtons}
      <Alert
        severity="info"
        variant="outlined"
        sx={{
          width: "100%",
          backgroundColor: "background.paper",
        }}
        action={CloseButton}
        icon={<i className="fas fa-bullhorn" />}
      >
        <Box
          sx={{
            width: "100%",
            wordBreak: "break-word",
            cursor: "default",
          }}
        >
          {content}
        </Box>
      </Alert>
    </Stack>
  );
};
