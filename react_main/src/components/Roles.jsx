import React, { useState, useContext, useRef } from "react";

import { UserContext, SiteInfoContext, PopoverContext } from "../Contexts";
import { SearchBar } from "./Nav";
import { useErrorAlert } from "./Alerts";
import { hyphenDelimit } from "../utils";
import { Alignments } from "../Constants";
import LoadingPage from "../pages/Loading";
import { TopBarLink } from "../pages/Play/Play";

export function RoleCount(props) {
  const roleRef = useRef();
  const popover = useContext(PopoverContext);
  const siteInfo = useContext(SiteInfoContext);

  // Display predicted icon
  const isRolePrediction = props.isRolePrediction;
  // Choose from list of icons to predict from
  const makeRolePrediction = props.makeRolePrediction;

  var roleName, modifiers;

  if (typeof props.role == "string") {
    roleName = props.role.split(":")[0];
    modifiers = props.role.split(":")[1];
  } else if (props.role) {
    roleName = props.role.name;
    modifiers = props.role.modifier;
  }

  if (isRolePrediction) {
    modifiers = "Unknown";
  }

  const roleClass = roleName
    ? `${hyphenDelimit(props.gameType)}-${hyphenDelimit(roleName)}`
    : "null";

  function onRoleClick() {
    if (props.onClick) props.onClick();

    if (makeRolePrediction) {
      makeRolePrediction(roleName);
      popover.close();
      return;
    }

    if (!roleName || !props.showPopover || roleName === "null") return;

    popover.onClick(
      Promise.resolve({
        data: {
          roleName: siteInfo.rolesRaw[props.gameType][roleName],
          modifiers: siteInfo.modifiers[props.gameType].filter((m) =>
            modifiers.split("/").includes(m.name)
          ),
        },
      }),
      "role",
      roleRef.current,
      roleName
    );
  }

  function onRoleGroupClick() {
    if (props.roleGroup) {
      popover.onClick(
        Promise.resolve({
          data: {
            roles: props.roleGroup,
            gameType: props.gameType,
          },
        }),
        "roleGroup",
        roleRef.current,
        "Role Group"
      );
    }
  }

  function onRoleMouseEnter(event) {
    if (props.onMouseEnter) props.onMouseEnter();

    if (!roleName || !props.showSecondaryHover || roleName === "null") return;

    // assumes that this is attached to a child in a popover
    popover.onHover(
      Promise.resolve({
        data: {
          roleName: siteInfo.rolesRaw[props.gameType][roleName],
          modifiers: siteInfo.modifiers[props.gameType].filter((m) =>
            modifiers.split("/").includes(m.name)
          ),
        },
      }),
      "role",
      roleRef.current,
      roleName,
      null,
      event.clientY
    );
  }

  const digits =
    props.count && !props.hideCount ? props.count.toString().split("") : "";

  if (props.closed && (props.count > 0 || props.hideCount)) {
    return (
      <div className="role-count-wrap closed-role-count">
        {!props.hideCount && <DigitsCount digits={digits} />}
        <i
          className={`fas fa-question i-${props.alignment}`}
          onClick={props.onClick}
        />
      </div>
    );
  } else if (props.roleGroup) {
    return (
      <div className="role-count-wrap">
        <div className="role-group-placeholder">
          <div
            className={`role role-${roleClass} ${props.small ? "small" : ""} ${
              props.bg ? "bg" : ""
            }`}
            ref={roleRef}
            onClick={onRoleGroupClick}
          >
            {!props.hideCount && <DigitsCount digits={digits} />}
          </div>
        </div>
      </div>
    );
  } else if (!props.closed) {
    return (
      <div className="role-count-wrap">
        <div
          className={`role role-${roleClass} ${props.small ? "small" : ""} ${
            props.bg ? "bg" : ""
          }`}
          title={`${roleName || ""} ${modifiers ? `(${modifiers})` : ""}`}
          onClick={onRoleClick}
          onMouseEnter={onRoleMouseEnter}
          ref={roleRef}
        >
          {props.count > 1 && <DigitsCount digits={digits} />}
          {modifiers &&
            modifiers
              .split("/")
              .map((modifier, k) => (
                <div
                  className={`modifier modifier-pos-${k} modifier-${
                    props.gameType
                  }-${hyphenDelimit(modifier)}`}
                />
              ))}
        </div>
      </div>
    );
  } else {
    return <></>;
  }
}

function DigitsCount(props) {
  const digits = props.digits;
  return (
    <>
      <div className="digits-wrapper">
        {digits.map((d) => (
          <div className={`digit digit-${d}`}></div>
        ))}
      </div>
    </>
  );
}

export function RoleSearch(props) {
  const [roleListType, setRoleListType] = useState(
    Alignments[props.gameType][0]
  );
  const [searchVal, setSearchVal] = useState("");
  const roleCellRefs = useRef([]);
  const errorAlert = useErrorAlert();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const popover = useContext(PopoverContext);

  function onAlignNavClick(alignment) {
    setSearchVal("");
    setRoleListType(alignment);
  }

  function onSearchInput(query) {
    setSearchVal(query.toLowerCase());

    if (query != "" && roleListType.length > 0) setRoleListType("");
    else if (query == "" && roleListType.length == 0)
      setRoleListType(Alignments[props.gameType][0]);
  }

  function onRoleCellClick(roleCellEl, role) {
    popover.onClick(
      Promise.resolve({
        data: {
          roleName: siteInfo.rolesRaw[props.gameType][role.name],
        },
      }),
      "role",
      roleCellEl,
      role.name
    );
  }

  const alignButtons = Alignments[props.gameType].map((type) => (
    <TopBarLink
      text={type}
      sel={roleListType}
      onClick={() => onAlignNavClick(type)}
      key={type}
    />
  ));

  if (!siteInfo.roles) return <LoadingPage className="roles-loading" />;

  const roleCells = siteInfo.roles[props.gameType].map((role, i) => {
    const hostile =
      role.alignment == "Independent" && role.hostile ? "hostile" : "";
    if (
      (!role.disabled || !role.hidden) &&
      (role.alignment == roleListType ||
        (searchVal.length > 0 &&
          role.name.toLowerCase().indexOf(searchVal) != -1))
    ) {
      return (
        <div className={`role-cell ${hostile}`} key={role.name}>
          {user.loggedIn && props.onAddClick && (
            <i
              className="add-role fa-plus-circle fas"
              onClick={(e) => {
                e.stopPropagation();
                props.onAddClick(role);
              }}
            />
          )}
          <div
            className="role-cell-content"
            onClick={() => onRoleCellClick(roleCellRefs.current[i], role)}
            ref={(el) => (roleCellRefs.current[i] = el)}
          >
            <RoleCount role={role.name} gameType={props.gameType} />
            {role.name}
          </div>
          <RoleBanners
            newlyAdded={role.newlyAdded}
            recentlyUpdated={role.recentlyUpdated}
            featured={role.featured}
          />
        </div>
      );
    }
  });

  return (
    <div className="role-list-container">
      <div className="top-bar">
        {alignButtons}
        <SearchBar
          value={searchVal}
          placeholder="Role Name"
          onInput={onSearchInput}
        />
      </div>
      <div className="role-list">{roleCells}</div>
    </div>
  );
}

function RoleBanners(props) {
  const newlyAdded = props.newlyAdded;
  const recentlyUpdated = props.recentlyUpdated;
  const featured = props.featured;

  var banners = [];
  if (newlyAdded) {
    banners.push(<RoleBanner type="newlyAdded" text="new" />);
  }

  if (recentlyUpdated) {
    banners.push(
      <RoleBanner type="recentlyUpdated" text={<i className="fas fa-sync" />} />
    );
  }

  if (featured) {
    banners.push(
      <RoleBanner type="featured" text={<i className="fas fa-star" />} />
    );
  }

  return (
    <>
      <div className="role-banner-wrapper">
        <div className="role-banners">{banners}</div>
      </div>
    </>
  );
}

function RoleBanner(props) {
  const text = props.text;
  const type = props.type;

  return (
    <>
      <div className={`role-banner ${type}`}>
        <div className="role-banner-text">{text}</div>
      </div>
    </>
  );
}
