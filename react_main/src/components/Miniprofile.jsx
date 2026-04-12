import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import axios from "axios";

import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import { KUDOS_ICON, KARMA_ICON, ACHIEVEMENTS_ICON } from "pages/User/Profile";
import { PieChart } from "pages/User/PieChart";
import { Avatar } from "pages/User/User";
import { UserContext, SiteInfoContext } from "Contexts";
import ReportDialog from "components/ReportDialog";
import { useErrorAlert } from "components/Alerts";
import {
  getTotalGames,
  getWins,
  getLosses,
  getAbandons,
} from "utils/mafiaStats";

function Miniprofile(props) {
  const user = props.user;
  const game = props.game;
  const inheritedProps = user.props;
  const currentUser = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const id = user.id;
  const name = user.name || "[deleted]";
  const pronouns = user.pronouns || "";
  const avatar = user.avatar;
  const color = inheritedProps.color;
  const avatarId = inheritedProps.avatarId;
  const hasDefaultPronouns = pronouns === "";
  const vanityUrl = user.vanityUrl;

  let pieChart = <></>;
  let totalGames = 0;
  if (user.stats?.["Mafia"]?.all) {
    const mafiaStats = user.stats["Mafia"].all;
    totalGames = getTotalGames(mafiaStats);
    pieChart = (
      <PieChart
        wins={getWins(mafiaStats)}
        losses={getLosses(mafiaStats)}
        abandons={getAbandons(mafiaStats)}
        showTotal
      />
    );
  }

  const profileLink = vanityUrl ? `/user/${vanityUrl}` : `/user/${id}`;

  const totalAchievements =
    Object.keys(siteInfo.achievementsRaw?.Mafia || {}).length || 40;

  const isSelf = currentUser.loggedIn && currentUser.id === id;
  const [isFriend, setIsFriend] = useState(user.isFriend || false);
  const [isFriendRequested, setIsFriendRequested] = useState(user.isFriendRequested || false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const gameId = game?.gameId || null;

  const reportPrefilledArgs = useMemo(
    () => ({
      userId: id,
      userName: name,
      game: gameId,
    }),
    [id, name, gameId]
  );

  // Update friend status when user prop changes
  useEffect(() => {
    setIsFriend(user.isFriend || false);
    setIsFriendRequested(user.isFriendRequested || false);
  }, [user.isFriend, user.isFriendRequested]);

  function onFriendUserClick() {
    if (isFriend || isFriendRequested) {
      var confirmMsg = isFriend
        ? "Are you sure you wish to unfriend this user?"
        : "Are you sure you wish to cancel your friend request?";
      if (!window.confirm(confirmMsg)) return;
    }

    axios
      .post("/api/user/friend", { user: id })
      .then((res) => {
        const msg = res.data;
        if (msg.includes("cancelled")) {
          setIsFriend(false);
          setIsFriendRequested(false);
        } else if (msg.includes("Unfriended")) {
          setIsFriend(false);
          setIsFriendRequested(false);
        } else if (msg.includes("accepted")) {
          setIsFriend(true);
          setIsFriendRequested(false);
        } else if (msg.includes("sent")) {
          setIsFriend(false);
          setIsFriendRequested(true);
        }
        siteInfo.showAlert(msg, "success");
      })
      .catch(errorAlert);
  }

  function onReportClick() {
    setReportDialogOpen(true);
  }

  return (
    <div className="miniprofile">
      <div className="mui-popover-title">
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Link
            className={`name-with-avatar`}
            to={profileLink}
            target="_blank"
            style={{ flex: 1, minWidth: 0 }}
          >
            <Stack direction="row" spacing={1}>
              <Avatar
                hasImage={avatar}
                id={id}
                avatarId={avatarId}
                name={name}
              />
              <div
                className={`user-name`}
                style={{
                  ...(color ? { color } : {}),
                  display: "inline",
                  alignSelf: "center",
                }}
              >
                {name}
              </div>
            </Stack>
          </Link>
          {!isSelf && currentUser.loggedIn && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={isFriend ? "Unfriend" : isFriendRequested ? "Cancel Friend Request" : "Send Friend Request"}>
                <IconButton
                  size="small"
                  onClick={onFriendUserClick}
                  sx={{
                    color: (isFriend || isFriendRequested) ? "primary.main" : "text.secondary",
                  }}
                >
                  <i className={`fas fa-user-plus ${(isFriend || isFriendRequested) ? "sel" : ""}`} />
                </IconButton>
              </Tooltip>
              <Button
                endIcon={<i className="fas fa-flag" />}
                size="small"
                onClick={onReportClick}
              >
                  Report
              </Button>
            </Stack>
          )}
        </Stack>
      </div>
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        prefilledArgs={reportPrefilledArgs}
      />
      {!hasDefaultPronouns && <div className="pronouns">({pronouns})</div>}
      {pieChart}
      <div className="score-info">
        <div className="score-info-column">
          <div className="score-info-row score-info-smallicon">
            <img src={KUDOS_ICON} />
          </div>
          <div className="score-info-row">{user.kudos}</div>
        </div>
        <div className="score-info-column">
          <div className="score-info-row score-info-smallicon">
            <img src={KARMA_ICON} />
          </div>
          <div className="score-info-row">{user.karma}</div>
        </div>
        <div className="score-info-column">
          <div className="score-info-row score-info-smallicon">
            <img src={ACHIEVEMENTS_ICON} />
          </div>
          <div className="score-info-row">{user.achievements.length}/{totalAchievements}</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Miniprofile);