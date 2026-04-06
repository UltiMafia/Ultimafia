import React, { useState, useEffect, useContext } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { NameWithAvatar } from "../../User/User";
import {
  Box,
  Card,
  Grid,
  IconButton,
  Typography,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import Form, { useForm } from "../../../components/Form";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../../Contexts";
import Comments from "../../Community/Comments";

import "css/buttons.css";
import "css/setupPage.css";

import { useErrorAlert } from "../../../components/Alerts";
import { Loading } from "../../../components/Loading";
import { RoleCount } from "../../../components/Roles";
import { getAlignmentColor } from "../../../components/Setup";
import { ExtraRoleData } from "../../../constants/ExtraRoleData";
import { VoteWidget } from "../../../components/VoteWidget";
import TwoPanelLayout from "../../../components/SetupProfileLayout";
import FanartPanel from "../../../components/FanartPanel";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export default function RolePage() {
  return (
    <div className="inner-content">
      <RoleThings />
    </div>
  );
}

export function RoleThings() {
  const { RoleName } = useParams();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const navigate = useNavigate();
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedRoleSkin, setSelectedRoleSkin] = useState("vivid");

  const [achievements, setAchievements] = useState(null);
  const [favoriteRoles, setFavoriteRoles] = useState([]);
  const [tempSkins, setTempSkins] = useState([
    { label: "Vivid", value: "vivid" },
  ]);
  const [siteFields, updateSiteFields] = useForm([
    {
      label: "Role Skin",
      ref: "roleSkins",
      type: "select",
      options: [{ label: "Vivid", value: "vivid" }],
    },
  ]);

  const role =
    RoleName && siteInfo.rolesRaw?.["Mafia"]?.[RoleName]
      ? [RoleName, siteInfo.rolesRaw["Mafia"][RoleName]]
      : null;

  useEffect(() => {
    if (!user?.id) return;

    axios
      .get(`/api/user/${user.id}/profile`)
      .then((res) => setAchievements(res.data.achievements))
      .catch((e) => {
        errorAlert(e);
        navigate("/play");
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !user.loggedIn) return;
    axios
      .get("/api/user/me/favorite-roles")
      .then((res) =>
        setFavoriteRoles(Array.isArray(res.data) ? res.data : [])
      )
      .catch(() => setFavoriteRoles([]));
  }, [user?.id, user?.loggedIn]);

  useEffect(() => {
    if (!role || !achievements) return;

    const skins = role[1].skins || [];
    const filtered = skins.filter((skin) => {
      if (skin.value === "vivid") return false;
      if (!skin.achCount && !skin.achReq) return true;
      if (skin.achReq && achievements.includes(skin.achReq)) return true;
      if (skin.achCount && parseInt(skin.achCount) <= achievements.length)
        return true;
      return false;
    });

    const finalOptions = [
      { label: "Vivid", value: "vivid" },
      ...filtered.map((skin) => ({
        label: skin.label || skin.value,
        value: skin.value,
      })),
    ];

    setTempSkins(finalOptions);
    updateSiteFields([
      {
        ref: "roleSkins",
        prop: "options",
        value: finalOptions,
      },
    ]);
  }, [achievements, role]);
  /*
  const updateFieldsFromData = (data) => {
    let changes = Object.keys(data).map((ref) => ({
      ref,
      prop: "value",
      value: data[ref],
    }));
    updateSiteFields(changes);
  };
  */

  useEffect(() => {
    axios
      .get("/api/site/contributors/art")
      .then((res) => {
        setContributors(res.data);
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(true);
        errorAlert(e);
      });
  }, []);

  useEffect(() => {
    document.title = `${RoleName || "Role"} | UltiMafia`;
  }, [RoleName]);

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;

  if (!role || !user.loaded) return <Loading small />;

  let commentLocation = `role/${RoleName}`;
  let temproleSkins;
  if (user.settings.roleSkins) {
    temproleSkins = user.settings.roleSkins.split(",");
  } else {
    temproleSkins = null;
  }
  const roleSkins = temproleSkins;

  // favourites <SetupRowInfo title="Current Skins" content={roleSkins} />

  let description = (
    <List>
      {role[1].description.map((line) => {
        return <ListItem>{line}</ListItem>;
      })}
    </List>
  );

  const sortedTags = Array.isArray(role[1].tags) ? [...role[1].tags].sort() : [];
  const tagsChips = (
    <Box display="flex" flexWrap="wrap" gap={0.75}>
      {sortedTags.map((tag) => (
        <Chip key={tag} label={tag} size="small" />
      ))}
    </Box>
  );

  let specialBox;
  if (role[1].SpecialInteractions) {
    specialBox = (
      <List dense sx={{ paddingTop: "0" }}>
        <div>
          <span style={{ fontWeight: "bold" }}>Special Interactions</span>
        </div>
        {Object.entries(role[1].SpecialInteractions).map((special, i) => (
          <ListItem
            key={special[0] + i}
            sx={{
              paddingBottom: "0",
              paddingTop: "0",
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: "0",
                marginRight: "8px",
              }}
            >
              {
                <RoleCount
                  key={0}
                  scheme="vivid"
                  role={special[0]}
                  gameType={"Mafia"}
                />
              }
            </ListItemIcon>
            <ListItemText
              disableTypography
              className={"mui-popover-text"}
              primary={
                <div>
                  <span style={{ fontWeight: "bold" }}>{special[0]}</span>:{" "}
                  {special[1][0]}
                </div>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  } else {
    specialBox = "";
  }

  let overrideBox;
  if (role[1].SpecialInteractionsModifiers) {
    specialBox = (
      <List dense sx={{ paddingTop: "0" }}>
        <div>
          <span style={{ fontWeight: "bold" }}>Modifier Overrides</span>
        </div>
        {Object.entries(role[1].SpecialInteractionsModifiers).map(
          (special, i) => (
            <ListItem
              key={special[0] + i}
              sx={{
                paddingBottom: "0",
                paddingTop: "0",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "0",
                  marginRight: "8px",
                }}
              >
                <i className={`modifier modifier-${"Mafia"}-${special[0]}`} />
              </ListItemIcon>
              <ListItemText
                disableTypography
                className={"mui-popover-text"}
                primary={
                  <div>
                    <span style={{ fontWeight: "bold" }}>{special[0]}</span>:{" "}
                    {special[1][0]}
                  </div>
                }
              />
            </ListItem>
          )
        )}
      </List>
    );
  } else {
    overrideBox = "";
  }

  let examples;
  let exampleData = ExtraRoleData["Mafia"][role[0]];
  if (exampleData && exampleData.examples) {
    examples = (
      <SetupRowInfo
        title="Examples"
        content={
          <List>
            {exampleData.examples.map((line) => {
              return <ListItem>{line}</ListItem>;
            })}
          </List>
        }
      />
    );
  } else {
    examples = "";
  }

  const alignmentColor = getAlignmentColor(role[1].alignment);

  function getHeaderTextColor(bg) {
    // Simple luminance check assuming hex color like #rrggbb
    if (!bg || bg[0] !== "#" || bg.length !== 7) return "#ffffff";
    const r = parseInt(bg.slice(1, 3), 16) / 255;
    const g = parseInt(bg.slice(3, 5), 16) / 255;
    const b = parseInt(bg.slice(5, 7), 16) / 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 0.6 ? "#000000" : "#ffffff";
  }

  const headerTextColor = getHeaderTextColor(alignmentColor);

  const roleVoteItem = {
    id: `Mafia:${RoleName}`,
    vote: role[1].vote ?? 0,
    voteCount: role[1].voteCount ?? 0,
  };

  const roleId = `Mafia:${RoleName}`;
  const isFavorited = favoriteRoles.indexOf(roleId) !== -1;

  const roleSkinField = siteFields.find((f) => f.ref === "roleSkins");
  const roleSkinOptions = roleSkinField?.options || [];

  useEffect(() => {
    let nextRoleSkin = "vivid";

    if (user?.settings && typeof user.settings.roleSkins === "string") {
      const userRoleSkins = user.settings.roleSkins.split(",");
      const matched = userRoleSkins.find((s) => s.split(":")[0] === RoleName);
      if (matched && matched.split(":")[1]) {
        nextRoleSkin = matched.split(":")[1];
      }
    }

    if (
      roleSkinField &&
      roleSkinField.value &&
      roleSkinOptions.some((o) => o.value === roleSkinField.value)
    ) {
      nextRoleSkin = roleSkinField.value;
    }

    if (
      roleSkinOptions.length > 0 &&
      !roleSkinOptions.some((o) => o.value === nextRoleSkin)
    ) {
      nextRoleSkin = roleSkinOptions[0].value;
    }

    setSelectedRoleSkin((prev) =>
      prev === nextRoleSkin ? prev : nextRoleSkin
    );
  }, [RoleName, roleSkinField, roleSkinOptions, user?.settings?.roleSkins]);

  const activeRoleSkin = roleSkinOptions.some(
    (o) => o.value === selectedRoleSkin
  )
    ? selectedRoleSkin
    : "vivid";

  const artists = (contributors || [])
    .filter((artist) =>
      artist.roles?.Mafia?.some((entry) => {
        const i = String(entry).lastIndexOf(":");
        if (i <= 0) return false;
        const entryRole = entry.slice(0, i);
        const entrySkin = entry.slice(i + 1) || "vivid";
        const normalizedSkin = entrySkin.toLowerCase();
        return (
          entryRole === RoleName && normalizedSkin === activeRoleSkin.toLowerCase()
        );
      })
    )
    .map((artist, index) => (
      <Box
        key={artist.user?.id || artist.user?.name}
        sx={{ mt: index === 0 ? 0 : 0.5 }}
      >
        <NameWithAvatar
          small
          id={artist.user?.id}
          name={artist.user?.name}
          avatar={artist.user?.avatar}
        />
      </Box>
    ));

  function onFavRole() {
    if (!user.loggedIn) return;
    axios
      .post("/api/user/role-favorite", { id: roleId })
      .then((res) =>
        setFavoriteRoles(Array.isArray(res.data) ? res.data : [])
      )
      .catch(errorAlert);
  }

  return (
    <Stack direction="column" spacing={1}>
      <Card
        variant="outlined"
        sx={{
          backgroundColor: alignmentColor,
          mb: 1,
          p: 1,
          color: headerTextColor,
        }}
      >
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="column" spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <VoteWidget
                      item={roleVoteItem}
                      itemType="role"
                      setItemHolder={() => {}}
                    />
                  </Box>
                  <RoleCount
                    key={0}
                    scheme={activeRoleSkin}
                    role={role[0]}
                    gameType={"Mafia"}
                    skin={activeRoleSkin}
                    large
                  />
                </Box>
                <Typography
                  variant="h2"
                  sx={{
                    ml: 2,
                    color: headerTextColor,
                  }}
                >
                  {RoleName}
                </Typography>
              </Stack>
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1}
                sx={{ mt: 0.5, maxWidth: 320 }}
              >
                <Typography
                  component="label"
                  variant="body2"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Role Skin
                </Typography>
                <Box
                  sx={{
                    width: { xs: "100%", md: "auto" },
                    minWidth: 72,
                  }}
                >
                  <select
                    value={activeRoleSkin}
                    onChange={(e) => {
                      const newSkin = e.target.value;
                      setSelectedRoleSkin(newSkin);
                      onRoleSkinChange(
                        {
                          prop: "value",
                          value: newSkin,
                          ref: "roleSkins",
                          localOnly: false,
                        },
                        RoleName,
                        null,
                        user,
                        roleSkins
                      );
                    }}
                    style={{
                      width: "100%",
                      minWidth: 72,
                      boxSizing: "border-box",
                    }}
                  >
                    {roleSkinOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Box>
              </Stack>
            </Stack>
          </Grid>
          <Grid item md={2} sx={{ display: { xs: "none", md: "block" } }} />
          <Grid item xs={12} md={2}>
            <Stack
              direction={isPhoneDevice ? "row" : "column"}
              spacing={0.5}
              sx={{
                alignItems: "center",
                color: headerTextColor,
              }}
            >
              <Typography
                variant="italicRelation"
                sx={{
                  ml: isPhoneDevice ? "auto" : 1,
                }}
              >
                Icon Artists
              </Typography>
              <Box sx={{ ml: 1 }}>{artists}</Box>
            </Stack>
          </Grid>
        </Grid>
      </Card>
      <TwoPanelLayout
        left={
          <>
            <div className="setup-page">
              <div className="box-panel">
                <div className="heading">Role Info</div>
                <div className="meta">
                  <SetupRowInfo title="Tags" content={tagsChips} />
                  <SetupRowInfo title="Description" content={description} />
                  {examples}
                  {specialBox}
                  {overrideBox}
                </div>
              </div>
            </div>
            <Box sx={{ mt: 1 }}>
              <Comments location={commentLocation} />
            </Box>
          </>
        }
        right={
          user.loggedIn && (
            <Stack direction="column" spacing={1}>
              <div className="box-panel">
                <div className="heading">Favorite this Role</div>
                <div className="content">
                  <Grid container sx={{ width: "8rem" }}>
                    <Grid item xs={3}>
                      <IconButton aria-label="favorite" onClick={onFavRole}>
                        <i
                          className={`setup-btn fav-setup fa-star ${
                            isFavorited ? "fas" : "far"
                          }`}
                        />
                      </IconButton>
                    </Grid>
                  </Grid>
                </div>
              </div>
              <div className="box-panel">
                <div className="content">
                  <FanartPanel roleId={roleId} />
                </div>
              </div>
            </Stack>
          )
        }
      />
    </Stack>
  );
}

function SetupRowInfo(props) {
  return (
    <div className="setup-row-info">
      <div className="title">{props.title}</div>
      <div className="content">{props.content}</div>
    </div>
  );
}

function onRoleSkinChange(action, role, update, user, roleSkins) {
  if (action.prop === "value" && !action.localOnly) {
    let roleformated = `${role}:${action.value}`;
    if (roleSkins == null) {
      roleSkins = [];
    }
    let array = roleSkins.filter((s) => s);
    let temp = roleSkins.filter((s) => s.split(":")[0] == role);
    if (temp.length > 0) {
      let index = roleSkins.indexOf(temp[0]);
      array[index] = roleformated;
    } else {
      array = array.concat([roleformated]);
    }
    let strArray = array.join(",");
    axios
      .post("/api/user/settings/update", {
        prop: action.ref,
        value: strArray,
      })
      .then(() => user.updateSetting(action.ref, strArray));
  }
  //update(action);

  /*
   role.skin = selection;
        await models.User.updateOne(
           { id: user.id },
          {
            $set: {
              roleSkins: user.roleSkins,
            },
          }
        ).exec();
*/
}
