import React, { useState, useContext, useEffect, useMemo } from "react";
import axios from "axios";

import { Box, Button, ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import { Link } from "react-router-dom";

import { KUDOS_ICON, KARMA_ICON, ACHIEVEMENTS_ICON } from "pages/User/profileIcons";
import { PieChart } from "pages/User/PieChart";
import { Avatar } from "pages/User/UserWidgets";

import { TIER_ICONS, getConservativeRank } from "utils/skillRating";
import { UserContext, SiteInfoContext } from "Contexts";
import ReportDialog from "components/ReportDialog";
import TrophyCase from "components/TrophyCase";
import { useErrorAlert } from "components/Alerts";
import {
  getTotalGames,
  getWins,
  getLosses,
  getAbandons,
  getWinRate,
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

  const [showAlignmentStats, setShowAlignmentStats] = useState(false);
  const mafiaStats = !user.settings?.hideStatistics && user.stats?.Mafia?.all;

  useEffect(() => {
    setShowAlignmentStats(false);
  }, [id]);

  let pieChart = <></>;
  let totalGames = 0;
  if (mafiaStats) {
    totalGames = getTotalGames(mafiaStats);
    pieChart = (
      <PieChart
        wins={getWins(mafiaStats)}
        losses={getLosses(mafiaStats)}
        abandons={getAbandons(mafiaStats)}
        showTotal
        onClick={() => setShowAlignmentStats((shown) => !shown)}
        expanded={showAlignmentStats}
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
      {/* Gate on `tier`, not on the object: an unrated player still gets a
          skillRating payload, but it carries only the progress counter -- reading
          mu/sigma off it would render "(CR: NaN)". */}
      {user.skillRating?.tier && !user.settings?.hideStatistics && (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, mb: 1, justifyContent: "center" }}>
          {TIER_ICONS[user.skillRating.tier] && (
            <img
              src={TIER_ICONS[user.skillRating.tier]}
              alt={user.skillRating.tier}
              style={{ width: 18, height: 18, objectFit: "contain" }}
            />
          )}
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {user.skillRating.tier} {user.skillRating.rank ? `#${user.skillRating.rank}` : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            (CR: {getConservativeRank(user.skillRating.mu, user.skillRating.sigma, 1)})
          </Typography>
        </Stack>
      )}
      {pieChart}
      {mafiaStats && totalGames > 0 && (
        <Box sx={{ mx: 1.5, mb: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
          <ButtonBase
            aria-expanded={showAlignmentStats}
            onClick={() => setShowAlignmentStats((shown) => !shown)}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              minHeight: 36,
              px: 1.5,
              py: 0.75,
              gap: 1,
              borderRadius: 1,
              textAlign: "left",
              color: "text.primary",
              bgcolor: showAlignmentStats ? "action.selected" : "action.hover",
              "&:hover": { bgcolor: "action.selected" },
              "&.Mui-focusVisible": { outline: "2px solid currentColor", outlineOffset: -2 },
            }}
          >
            <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
              Town / Mafia win rates
            </Typography>
            <KeyboardArrowDownRounded
              fontSize="small"
              sx={{
                color: "text.secondary",
                flexShrink: 0,
                transform: showAlignmentStats ? "rotate(180deg)" : undefined,
              }}
            />
          </ButtonBase>
          {showAlignmentStats && (
            <Box sx={{ contain: "inline-size" }}>
              <Box component="dl" sx={{ m: 0, px: 1.5 }}>
                {[["Village", "Town"], ["Mafia", "Mafia"]].map(([alignment, label]) => {
                  const stats = mafiaStats.byAlignment?.[alignment];
                  const games = getTotalGames(stats);
                  return (
                    <Box
                      key={alignment}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                        py: 0.75,
                        "& + &": { borderTop: 1, borderColor: "divider" },
                      }}
                    >
                      <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      <Box component="dd" sx={{ m: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {games > 0 && (
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {(getWinRate(stats) * 100).toFixed(1)}%
                          </Typography>
                        )}
                        <Typography variant="caption" component="div" color="text.secondary">
                          {games > 0 ? `${getWins(stats)} wins / ${games} games` : "No recorded games"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}
      {user.trophies?.length > 0 && (
        <Box component="section" aria-label="Trophies" sx={{ p: 1 }}>
          <TrophyCase trophies={user.trophies} showHeading={false} wrapInPanel={false} keyboardAccessible />
        </Box>
      )}
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