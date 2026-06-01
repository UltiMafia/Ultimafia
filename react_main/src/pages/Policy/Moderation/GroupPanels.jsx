import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Stack,
  Typography,
  IconButton,
  Popover,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { UserSearchSelect } from "components/Form";
import { SiteInfoContext } from "Contexts";
import { Badge, NameWithAvatar, StatusIcon } from "pages/User/User";
import { Loading } from "components/Loading";

export function GroupPanels({ user }) {
  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [addAnchor, setAddAnchor] = useState(null);
  const [addingToGroup, setAddingToGroup] = useState(null);
  const [addSelectKey, setAddSelectKey] = useState(0);

  const errorAlert = useErrorAlert();
  const siteInfo = useContext(SiteInfoContext);

  const canManageGroup = Boolean(user?.perms?.giveGroup);

  const fetchGroups = useCallback(() => {
    return axios
      .get("/api/mod/groups")
      .then((res) => {
        setGroups(res.data.sort((a, b) => b.rank - a.rank));
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(true);
        errorAlert(e);
      });
  }, [errorAlert]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  function openAddPopover(event, groupName) {
    setAddAnchor(event.currentTarget);
    setAddingToGroup(groupName);
    setAddSelectKey((k) => k + 1);
  }

  function closeAddPopover() {
    setAddAnchor(null);
    setAddingToGroup(null);
  }

  function addMember(userId) {
    if (!userId || !addingToGroup) return;

    axios
      .post("/api/mod/addToGroup", { groupName: addingToGroup, userId })
      .then(() => {
        siteInfo.showAlert("User added to group.", "success");
        closeAddPopover();
        fetchGroups();
      })
      .catch(errorAlert);
  }

  function removeMember(groupName, userId) {
    axios
      .post("/api/mod/removeFromGroup", { groupName, userId })
      .then(() => {
        siteInfo.showAlert("User removed from group.", "success");
        fetchGroups();
      })
      .catch(errorAlert);
  }

  if (!loaded) return <Loading small />;

  const panels = groups.map((group) => {
    const members = group.members.map((member) => (
      <Grid item xs={12} md={6} key={member.id}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            p: 1,
            backgroundColor: "var(--scheme-color)",
          }}
        >
          <NameWithAvatar
            id={member.id}
            name={member.name}
            avatar={member.avatar}
          />
          <StatusIcon status={member.status} />
          {canManageGroup && (
            <IconButton
              size="small"
              onClick={() => removeMember(group.name, member.id)}
              sx={{ color: "error.main", ml: "auto" }}
              title={`Remove from ${group.name}`}
              aria-label={`Remove ${member.name} from ${group.name}`}
            >
              <i className="fas fa-times" />
            </IconButton>
          )}
        </Stack>
      </Grid>
    ));

    return (
      <div className="box-panel group-panel" key={group.name}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: "100%" }}
        >
          <Typography variant="h4">{group.name + "s"}</Typography>
          {group.badge && (
            <Badge
              icon={group.badge}
              color={group.badgeColor || "black"}
              name={group.name}
            />
          )}
          {canManageGroup && (
            <IconButton
              size="small"
              onClick={(e) => openAddPopover(e, group.name)}
              sx={{ color: "primary.main", ml: "auto" }}
              title={`Add user to ${group.name}`}
              aria-label={`Add user to ${group.name}`}
            >
              <i className="fas fa-plus" />
            </IconButton>
          )}
        </Stack>
        <Grid container rowSpacing={1} columnSpacing={1}>
          {members}
        </Grid>
      </div>
    );
  });

  return (
    <>
      {panels}
      <Popover
        open={Boolean(addAnchor)}
        anchorEl={addAnchor}
        onClose={closeAddPopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Add user to {addingToGroup}
          </Typography>
          <UserSearchSelect
            key={addSelectKey}
            value=""
            onChange={(userId) => {
              if (userId) addMember(userId);
            }}
            placeholder="Search user…"
          />
        </Box>
      </Popover>
    </>
  );
}
