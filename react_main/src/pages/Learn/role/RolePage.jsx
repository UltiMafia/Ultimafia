import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { ViewNavigate as Navigate, useViewNavigate as useNavigate } from "hooks/useViewActivity";
import { NameWithAvatar } from "../../User/UserWidgets";
import {
  Box,
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
import { UiAction, UiField, UiIcon, UiPageHeader } from "components/ui";

export default function RolePage() {
  return <RoleThings />;
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

  const theme = useTheme();
  const roleSkinField = siteFields.find((f) => f.ref === "roleSkins");
  const roleSkinOptions = roleSkinField?.options || [];

  useEffect(() => {
    let nextRoleSkin = "vivid";
    if (typeof user?.settings?.roleSkins === "string") {
      const matched = user.settings.roleSkins.split(",")
        .find((skin) => skin.split(":")[0] === RoleName);
      if (matched?.split(":")[1]) nextRoleSkin = matched.split(":")[1];
    }
    if (roleSkinField?.value && roleSkinOptions.some((option) => option.value === roleSkinField.value)) {
      nextRoleSkin = roleSkinField.value;
    }
    if (roleSkinOptions.length > 0 && !roleSkinOptions.some((option) => option.value === nextRoleSkin)) {
      nextRoleSkin = roleSkinOptions[0].value;
    }
    setSelectedRoleSkin((previous) => previous === nextRoleSkin ? previous : nextRoleSkin);
  }, [RoleName, roleSkinField, roleSkinOptions, user?.settings?.roleSkins]);

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

  const description = <div className="role-description">{role[1].description.map((line, index) => <p key={index}>{line}</p>)}</div>;

  const sortedTags = Array.isArray(role[1].tags) ? [...role[1].tags].filter(tag => tag !== role[1].alignment).sort() : [];

  let specialBox = null;
  if (role[1].SpecialInteractions && Object.keys(role[1].SpecialInteractions).length > 0) {
    specialBox = <section className="role-info-section">
      <h2>Special interactions</h2>
      <ul className="role-interactions">
        {Object.entries(role[1].SpecialInteractions).map(([name, interaction]) => <li key={name}>
          <RoleCount scheme="vivid" role={name} gameType="Mafia" />
          <p><strong>{name}</strong>: {interaction[0]}</p>
        </li>)}
      </ul>
    </section>;
  }

  let overrideBox;
  if (role[1].SpecialInteractionsModifiers && Object.keys(role[1].SpecialInteractionsModifiers).length > 0) {
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
    examples = <section className="role-info-section">
      <h2>Examples</h2>
      <ol className="role-examples">{exampleData.examples.map((line, index) => <li key={index}>{line}</li>)}</ol>
    </section>;
  } else {
    examples = null;
  }

  const alignmentColor = getAlignmentColor(role[1].alignment);
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
    <div className="role-page">
      <UiPageHeader variant="detail" title={RoleName} className="role-hero" leading={
          <RoleCount key={0} scheme={activeRoleSkin} role={role[0]} gameType="Mafia" skin={activeRoleSkin} large />
        } actions={<div className="role-hero-actions">
          <VoteWidget item={roleVoteItem} itemType="role" setItemHolder={(newItem) => setRoleVoteState({ vote: newItem.vote ?? 0, voteCount: newItem.voteCount ?? 0 })} />
          {user.loggedIn && <UiAction variant={isFavorited ? "primary" : "secondary"} aria-pressed={isFavorited} onClick={onFavRole}><UiIcon name={isFavorited ? "starFilled" : "star"} />{isFavorited ? "Favorited" : "Favorite role"}</UiAction>}
        </div>}>
          <span className="role-alignment" style={{ color: alignmentColor }}>{role[1].alignment}</span>
          {sortedTags.length > 0 && <ul className="role-tags" aria-label="Role tags">{sortedTags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
          <div className="role-skin-control">
            <span>Icon skin</span>
            <UiField select size="small" SelectProps={{ native: true }} value={activeRoleSkin} onChange={(event) => {
              const newSkin = event.target.value;
              setSelectedRoleSkin(newSkin);
              onRoleSkinChange({ prop: "value", value: newSkin, ref: "roleSkins", localOnly: false }, RoleName, null, user, roleSkins);
            }}>{roleSkinOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</UiField>
          </div>
          {artists.length > 0 && <div className="role-artists"><span>Icon artists</span>{artists}</div>}
      </UiPageHeader>
      <TwoPanelLayout
        left={<>
          <section className="role-info">
            <h2>Role info</h2>
            {description}
            {examples}
            {specialBox}
            {overrideBox}
          </section>
          <section className="role-comments"><h2>Discussion</h2><Comments location={commentLocation} /></section>
        </>}
        right={<div className="role-side">
          <FanartPanel roleId={roleId} />
        </div>}
      />
    </div>
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
