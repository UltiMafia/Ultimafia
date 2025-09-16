import React, { useState, useContext, useRef, useLayoutEffect } from "react";
import axios from "axios";

import { PopoverContext } from "../Contexts";
import { SmallRoleList } from "./Setup";
import { useErrorAlert } from "./Alerts";
import { useOnOutsideClick } from "./Basic";

import "css/popover.css";

export default function PopoverOld() {
  // TODO remove this thing
  const popover = useContext(PopoverContext);
  const popoverRef = useRef();
  const triangleRef = useRef();
  const sideContentRef = useRef();

  useOnOutsideClick([{ current: popover.boundingEl }, popoverRef], () => {
    if (!popover.loadingRef.current) {
      popover.setVisible(false);
      popover.setSideContentVisible(false);
      popover.setBoundingEl(null);
    }
  });

  useLayoutEffect(() => {
    if (!popover.visible) return;

    const boundingRect = popover.boundingEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    var triangleLeft = boundingRect.left + boundingRect.width;
    var triangleTop =
      boundingRect.top - 10 + boundingRect.height / 2 + window.scrollY;

    var popoverLeft = boundingRect.left + boundingRect.width + 10;
    var popoverTop =
      boundingRect.top -
      popoverRect.height / 2 +
      boundingRect.height / 2 +
      window.scrollY;
    var popoverHorzShift =
      window.innerWidth - (popoverLeft + popoverRect.width);

    if (popoverTop < window.scrollY) popoverTop = window.scrollY;

    if (popoverHorzShift < 0) {
      if (popoverLeft + popoverHorzShift < 0)
        popoverHorzShift -= popoverLeft + popoverHorzShift;
    } else popoverHorzShift = 0;

    popoverLeft += popoverHorzShift;
    triangleLeft += popoverHorzShift;

    triangleRef.current.style.left = triangleLeft + "px";
    triangleRef.current.style.top = triangleTop + "px";
    triangleRef.current.style.visibility = "visible";

    popoverRef.current.style.top = popoverTop + "px";
    popoverRef.current.style.left = popoverLeft + "px";
    popoverRef.current.style.visibility = "visible";

    if (popover.sideContentVisible) {
      sideContentRef.current.style.width = popoverRect.width + "px"; // Gives consistent styling + just makes loading not funky

      const useLeft =
        popoverRect.x > window.innerWidth - (popoverRect.x + popoverRect.width)
          ? popoverRect.x - popoverRect.width
          : popoverRect.x + popoverRect.width;

      sideContentRef.current.style.top = popover.sideContentMouseY + "px";
      sideContentRef.current.style.left = useLeft + "px";
      sideContentRef.current.style.visibility = "visible";
    }
  });

  return (
    popover.visible && (
      <>
        <div className="triangle triangle-left" ref={triangleRef} />
        <div className={`popover-window`} ref={popoverRef}>
          <div className="popover-title">{popover.title}</div>
          {!popover.loading && (
            <div className="popover-content">{popover.content}</div>
          )}
        </div>
        {popover.sideContentVisible && (
          <div className={`popover-window`} ref={sideContentRef}>
            <div className="popover-title">{popover.sideContentTitle}</div>
            {!popover.sideContentLoading && (
              <div className="popover-content">{popover.sideContent}</div>
            )}
          </div>
        )}
      </>
    )
  );
}

export function usePopover(siteInfo) {
  const [visible, setVisible] = useState(false);
  const [boundingEl, setBoundingEl] = useState();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sideContent, setSideContent] = useState("");
  const [sideContentTitle, setSideContentTitle] = useState("");
  const [sideContentVisible, setSideContentVisible] = useState("");
  const [sideContentLoading, setSideContentLoading] = useState(false);
  const [sideContentMouseY, setSideContentMouseY] = useState(0);

  const loadingRef = useRef();
  const errorAlert = useErrorAlert(siteInfo);

  function close() {
    setVisible(false);
    setSideContentVisible(false);
    setBoundingEl(null);
  }

  function onClick(path, type, _boundingEl, title, dataMod) {
    if (_boundingEl === boundingEl) {
      setVisible(false);
      setSideContentVisible(false);
      setBoundingEl(null);
    } else load(path, type, _boundingEl, title, dataMod);
  }

  function onHover(path, type, _boundingEl, title, dataMod, mouseY) {
    if (!sideContentLoading && title !== sideContentTitle) {
      // using this just so requests aren't massive
      setSideContentMouseY(mouseY);
      load(path, type, _boundingEl, title, dataMod, true);
    }
  }

  function open(boundingEl, title, sideload) {
    if (sideload) {
      setSideContentTitle(title);
      setSideContentLoading(true);
      setSideContentVisible(true);
    } else {
      setBoundingEl(boundingEl);

      setTitle(title);
      setSideContentVisible(false);
      setLoading(true);
      setVisible(true);

      loadingRef.current = true;
    }
  }

  function ready(content, type, title, sideload) {
    switch (type) {
      case "rolePrediction":
        content = parseRolePredictionPopover(content);
        break;
      case "role":
        content = parseRolePopover(content.roleName, content.modifiers);
        break;
      case "modifier":
        content = parseModifierPopover(content.roleName);
        break;
      case "roleGroup":
        content = parseRoleGroupPopover(content);
        break;
    }

    if (sideload) {
      setSideContent(content);
      setSideContentTitle(title); // doing this here guarentees the content + title are synced if multiple hovers are firing at once
      setSideContentLoading(false);
    } else {
      setContent(content);
      setLoading(false);
    }
  }

  function load(path, type, boundingEl, title, dataMod, sideload) {
    open(boundingEl, title, sideload);

    let promise;

    if (path instanceof Promise) {
      promise = path;
    } else {
      promise = axios.get(path);
    }
    promise
      .then((res) => {
        if (dataMod) dataMod(res.data);

        loadingRef.current = false;
        ready(res.data, type, title, sideload);
      })
      .catch(errorAlert);
  }

  return {
    visible,
    setVisible,
    boundingEl,
    setBoundingEl,
    title,
    setTitle,
    content,
    setContent,
    loading,
    setLoading,
    close,
    onClick,
    onHover,
    open,
    ready,
    load,
    loadingRef,
    sideContent,
    sideContentVisible,
    setSideContentVisible,
    sideContentTitle,
    sideContentLoading,
    sideContentMouseY,
  };
}

export function InfoRow(props) {
  return (
    <div className="info-row">
      <div className="title">{props.title}</div>
      <div className="content">{props.content}</div>
    </div>
  );
}

export function parseRolePredictionPopover(data) {
  let roleset = Object.keys(data.roles);
  roleset.unshift(undefined);

  return (
    <SmallRoleList
      roles={roleset}
      makeRolePrediction={data.toggleRolePrediction}
      gameType={data.gameType}
      setup={data.setup}
      otherRoles={data.otherRoles}
      includeSearchBar
    />
  );
}

export function parseRoleGroupPopover(data) {
  let roleset = Object.keys(data.roles);

  return (
    <SmallRoleList
      roles={roleset}
      gameType={data.gameType}
      setup={data.setup}
      otherRoles={data.otherRoles}
    />
  );
}

export function parseRolePopover(role, modifiers) {
  const result = [];

  if (!role) {
    return [];
  }

  //Alignment
  result.push(
    <InfoRow title="Alignment" content={role.alignment} key="alignment" />
  );

  //Description
  const descLines = [];

  for (let i in role.description)
    descLines.push(<li key={i}>{role.description[i]}</li>);

  result.push(
    <InfoRow title="Description" content={<ul>{descLines}</ul>} key="desc" />
  );

  if (modifiers) {
    for (const modifier of modifiers) {
      result.push(
        <InfoRow
          title={`Modifier: ${modifier.name}`}
          content={
            <ul>
              <li key={modifier.name}>
                {role.alignment == "Event" && modifier.eventDescription != null
                  ? modifier.eventDescription
                  : modifier.description}
              </li>
            </ul>
          }
          key={modifier.name}
        />
      );
    }
  }

  return result;
}

export function parseModifierPopover(mod) {
  const result = [];

  if (!mod) {
    return [];
  }

  //Description
  const descLines = [mod.description];

  result.push(
    <InfoRow title="Description" content={<ul>{descLines}</ul>} key="desc" />
  );

  return result;
}
