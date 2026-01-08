import React, { useState, useContext, useRef, useEffect } from "react";

import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import { KUDOS_ICON, KARMA_ICON, ACHIEVEMENTS_ICON } from "pages/User/Profile";
import { PieChart } from "pages/User/PieChart";
import { Avatar } from "pages/User/User";
import { UserContext, SiteInfoContext } from "Contexts";
import ReportDialog from "components/ReportDialog";
import { useErrorAlert } from "components/Alerts";

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
  if (user.stats) {
    const mafiaStats = user.stats["Mafia"].all;
    pieChart = (
      <PieChart
        wins={mafiaStats.wins.count}
        losses={mafiaStats.wins.total - mafiaStats.wins.count}
        abandons={mafiaStats.abandons.total}
      />
    );
  }

  const profileLink = vanityUrl ? `/user/${vanityUrl}` : `/user/${id}`;

  const isSelf = currentUser.loggedIn && currentUser.id === id;
  const [isFriend, setIsFriend] = useState(user.isFriend || false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const gameId = game?.gameId || null;

  // Update friend status when user prop changes
  useEffect(() => {
    setIsFriend(user.isFriend || false);
  }, [user.isFriend]);

  function onFriendUserClick() {
    if (isFriend) {
      var shouldUnfriend = window.confirm(
        "Are you sure you wish to unfriend or cancel your friend request?"
      );
      if (!shouldUnfriend) return;
    }

    axios
      .post("/api/user/friend", { user: id })
      .then((res) => {
        setIsFriend(!isFriend);
        siteInfo.showAlert(res.data, "success");
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
              <Tooltip title={isFriend ? "Unfriend" : "Send Friend Request"}>
                <IconButton
                  size="small"
                  onClick={onFriendUserClick}
                  sx={{
                    color: isFriend ? "primary.main" : "text.secondary",
                  }}
                >
                  <i className={`fas fa-user-plus ${isFriend ? "sel" : ""}`} />
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
        prefilledArgs={{
          userId: id,
          userName: name,
          game: gameId,
        }}
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
          <div className="score-info-row">{user.achievements.length}/40</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Miniprofile);