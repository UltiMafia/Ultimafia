import React, { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { SiteInfoContext } from "Contexts";
import { NameWithAvatar } from "pages/User/UserWidgets";

function formatDate(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleString();
}

// Staff view of the block requests involving one user. A block already stops
// DMs and profile comments; approving a request also keeps the two out of
// each other's games. Approve is the only action.
export function BlockRequests({ userId }) {
  const [data, setData] = useState(null);
  const [approving, setApproving] = useState(null);
  const errorAlert = useErrorAlert();
  const siteInfo = useContext(SiteInfoContext);

  const load = useCallback(() => {
    if (!userId) return;
    axios
      .get(`/api/mod/blockRequests?userId=${encodeURIComponent(userId)}`)
      .then((res) => setData(res.data))
      .catch(errorAlert);
  }, [userId]);

  useEffect(load, [load]);

  function approve(request) {
    setApproving(request.id);
    axios
      .post("/api/mod/blockRequests/approve", { requestId: request.id })
      .then(() => {
        siteInfo.showAlert("Game block approved.", "success");
        load();
      })
      .catch((e) => {
        errorAlert(e);
        load();
      })
      .finally(() => setApproving(null));
  }

  if (!data) return null;

  return (
    <Stack direction="column" spacing={1} className="block-requests">
      <Typography variant="h4">Block requests for {data.user.name}</Typography>
      {data.requests.length === 0 && (
        <Typography>No block requests involve this user.</Typography>
      )}
      {data.requests.map((request) => (
        <Box
          key={request.id}
          className="block-request"
          sx={{ p: 1, backgroundColor: "var(--scheme-color)" }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <NameWithAvatar
              id={request.blocker.id}
              name={request.blocker.name}
              avatar={request.blocker.avatar}
              small
            />
            <Typography>blocked</Typography>
            <NameWithAvatar
              id={request.blocked.id}
              name={request.blocked.name}
              avatar={request.blocked.avatar}
              small
            />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {formatDate(request.date)}
              {request.legacy ? " (block made before requests existed)" : ""}
            </Typography>
            <Box sx={{ marginLeft: "auto !important" }}>
              {request.status === "approved" ? (
                <Chip
                  color="success"
                  size="small"
                  label={`Approved${
                    request.approvedBy ? ` by ${request.approvedBy.name}` : ""
                  } ${formatDate(request.approvedAt)}`}
                />
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  disabled={approving === request.id}
                  onClick={() => approve(request)}
                >
                  Approve
                </Button>
              )}
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
