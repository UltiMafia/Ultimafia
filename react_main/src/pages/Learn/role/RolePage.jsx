import React, { useState, useEffect, useContext } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { NameWithAvatar } from "../../User/User";
import {
  Box,
  Button,
  Card,
  MenuItem,
  Select,
  Typography,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
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
  const [roleVoteState, setRoleVoteState] = useState({ vote: 0, voteCount: 0 });
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
  }, [achievements, RoleName]);
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

  useEffect(() => {
    if (!RoleName) return;
    const roleId = `Mafia:${RoleName}`;
    setRoleVoteState({ vote: 0, voteCount: 0 });
    axios
      .get(`/api/votes/role/${encodeURIComponent(roleId)}`)
      .then((res) =>
        setRoleVoteState({
          vote: Number(res.data?.vote) || 0,
          voteCount: Number(res.data?.voteCount) || 0,
        })
      )
      .catch(() => {});
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
  const theme = useTheme();
  const isLightMode = theme.palette.mode === "light";

  // Match SetupPage banner legibility: light mode uses near-black text,
  // dark mode uses white with a soft drop shadow so any pastel banner reads.
  const headerTextColor = isLightMode ? "#141414" : "#fff";
  const headerTextShadow = isLightMode ? "none" : "0 1px 3px rgba(0,0,0,0.75)";

  const roleId = `Mafia:${RoleName}`;
  const roleVoteItem = {
    id: roleId,
    vote: roleVoteState.vote,
    voteCount: roleVoteState.voteCount,
  };

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
    <Stack direction="column" spacing={1} className="setup-page">
      <Card
        variant="outlined"
        sx={{
          backgroundColor: alignmentColor,
          borderRadius: "16px",
          mb: 1,
          p: { xs: 1.5, md: 2 },
          color: headerTextColor,
          textShadow: headerTextShadow,
          "& .MuiTypography-root": {
            color: headerTextColor,
            textShadow: headerTextShadow,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <VoteWidget
              item={roleVoteItem}
              itemType="role"
              setItemHolder={(newItem) =>
                setRoleVoteState({
                  vote: newItem.vote ?? 0,
                  voteCount: newItem.voteCount ?? 0,
                })
              }
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: isPhoneDevice ? 1 : 1.5,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <RoleCount
                key={0}
                scheme={activeRoleSkin}
                role={role[0]}
                gameType={"Mafia"}
                skin={activeRoleSkin}
                large
              />
            </Box>
          </Stack>

          <Stack
            direction="column"
            spacing={0.75}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="h2" sx={{ mr: 0.5 }}>
                {RoleName}
              </Typography>
              {sortedTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    fontWeight: 600,
                    border: "1px solid rgba(255,255,255,0.25)",
                    textShadow: "none",
                    "& .MuiChip-label": { textShadow: "none" },
                  }}
                />
              ))}
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  opacity: 0.7,
                  lineHeight: 1,
                }}
              >
                Skin
              </Typography>
              <Select
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
                variant="standard"
                disableUnderline
                IconComponent={(props) => (
                  <i
                    {...props}
                    className={`fas fa-chevron-down ${props.className || ""}`}
                    style={{ fontSize: "0.7rem", right: 10 }}
                  />
                )}
                sx={{
                  minWidth: 96,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.25,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#fff",
                  textShadow: "none",
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "border-color 120ms, background-color 120ms",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.45)",
                    backgroundColor: "rgba(0,0,0,0.35)",
                  },
                  "& .MuiSelect-select": {
                    paddingTop: "2px",
                    paddingBottom: "2px",
                    paddingRight: "28px !important",
                  },
                  "& .MuiSelect-icon": {
                    color: "rgba(255,255,255,0.7)",
                    top: "calc(50% - 0.35em)",
                  },
                }}
              >
                {roleSkinOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>

          {artists.length > 0 && (
            <Stack
              direction="column"
              spacing={0.5}
              alignItems={{ xs: "flex-start", md: "flex-end" }}
              sx={{ minWidth: 120 }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  opacity: 0.7,
                  lineHeight: 1,
                }}
              >
                Icon Artists
              </Typography>
              <Box>{artists}</Box>
            </Stack>
          )}
        </Stack>
      </Card>
      <TwoPanelLayout
        left={
          <>
            <div className="box-panel">
              <div className="heading">Role Info</div>
              <div className="meta">
                <SetupRowInfo title="Description" content={description} />
                {examples}
                {specialBox}
                {overrideBox}
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
                <Button
                  fullWidth
                  onClick={onFavRole}
                  startIcon={
                    <i
                      className={`fa-star ${isFavorited ? "fas" : "far"}`}
                      style={{ color: "#f5c518" }}
                    />
                  }
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1,
                    color: isFavorited ? "#f5c518" : "text.primary",
                    border: "1px solid",
                    borderColor: isFavorited
                      ? "rgba(245,197,24,0.55)"
                      : "rgba(127,127,127,0.35)",
                    backgroundColor: isFavorited
                      ? "rgba(245,197,24,0.12)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isFavorited
                        ? "rgba(245,197,24,0.2)"
                        : "rgba(127,127,127,0.1)",
                    },
                  }}
                >
                  {isFavorited ? "Favorited" : "Favorite this role"}
                </Button>
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
