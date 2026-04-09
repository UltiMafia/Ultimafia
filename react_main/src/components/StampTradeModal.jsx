import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  Divider,
} from "@mui/material";

import { SiteInfoContext, UserContext } from "Contexts";
import { StampItem } from "components/Scrapbook";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";

export default function StampTradeModal({
  open,
  onClose,
  stamp,
  onTradeAction,
  recipientId,
  recipientName,
}) {
  const siteInfo = useContext(SiteInfoContext);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const [incomingTrades, setIncomingTrades] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setSelectedTradeId(null);
    setSelectedFriendId(null);
    setSearchVal("");

    axios
      .get("/api/stampTrades/incoming")
      .then((res) => setIncomingTrades(res.data || []))
      .catch(() => setIncomingTrades([]));

    if (!recipientId) {
      axios
        .get(`/api/user/${user.id}/friends`)
        .then((res) => setFriends(res.data || []))
        .catch(() => setFriends([]));
    }
  }, [open, user?.id]);

  if (!stamp) return null;

  const filteredFriends = friends.filter((f) =>
    (f.name || "").toLowerCase().includes(searchVal.toLowerCase())
  );

  function handleSelectTrade(tradeId) {
    setSelectedTradeId(tradeId);
    setSelectedFriendId(null);
  }

  function handleSelectFriend(friendId) {
    setSelectedFriendId(friendId);
    setSelectedTradeId(null);
  }

  function handleRespond() {
    if (!selectedTradeId || submitting) return;
    setSubmitting(true);
    axios
      .post("/api/stampTrades/respond", {
        tradeId: selectedTradeId,
        gameType: stamp.gameType,
        role: stamp.role,
      })
      .then(() => {
        siteInfo.showAlert("Trade response sent.", "success");
        if (onTradeAction) onTradeAction();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  }

  function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    const body = {
      gameType: stamp.gameType,
      role: stamp.role,
    };
    const targetId = recipientId || selectedFriendId;
    if (targetId) body.recipientUserId = targetId;
    axios
      .post("/api/stampTrades/initiate", body)
      .then(() => {
        siteInfo.showAlert(
          targetId ? "Trade sent." : "Trade posted publicly.",
          "success"
        );
        if (onTradeAction) onTradeAction();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  }

  const selectedFriend = selectedFriendId
    ? friends.find((f) => f.id === selectedFriendId)
    : null;

  let startLabel;
  if (recipientId) {
    startLabel = `Send to ${recipientName || "user"}`;
  } else if (selectedFriend) {
    startLabel = `Send to ${selectedFriend.name}`;
  } else {
    startLabel = "Start public trade";
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <span>Trade</span>
          <StampItem role={stamp.role} gameType={stamp.gameType} size="small" />
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {stamp.role}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Incoming trades
        </Typography>
        {incomingTrades.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            No pending trades from others.
          </Typography>
        ) : (
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {incomingTrades.map((t) => {
              const selected = selectedTradeId === t.id;
              return (
                <Box
                  key={t.id}
                  className={`stamp-trade-row${selected ? " stamp-trade-row--selected" : ""}`}
                  onClick={() => handleSelectTrade(t.id)}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ flex: 1 }}
                  >
                    <NameWithAvatar
                      id={t.initiator?.id}
                      name={t.initiator?.name}
                      avatar={t.initiator?.avatar}
                      noLink
                      small
                    />
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      offers
                    </Typography>
                    <StampItem
                      role={t.initiatorRole}
                      gameType={t.initiatorGameType}
                      size="small"
                    />
                    <Typography variant="caption">
                      {t.initiatorRole}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {!recipientId && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
              Send to a friend
            </Typography>
            <TextField
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search friends"
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
            {filteredFriends.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                {friends.length === 0 ? "No friends yet." : "No matches."}
              </Typography>
            ) : (
              <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: "auto" }}>
                {filteredFriends.map((f) => {
                  const selected = selectedFriendId === f.id;
                  return (
                    <Box
                      key={f.id}
                      className={`stamp-trade-row${selected ? " stamp-trade-row--selected" : ""}`}
                      onClick={() => handleSelectFriend(f.id)}
                    >
                      <NameWithAvatar
                        id={f.id}
                        name={f.name}
                        avatar={f.avatar}
                        noLink
                        small
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        {selectedTradeId ? (
          <Button
            onClick={handleRespond}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            Respond to Trade
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {startLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
