import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { activateOnEnterOrSpace } from "../utils/keyboard";
import { InGameContext } from "Contexts";

export const usePopoverOpen = () => {
  const location = useLocation();
  const inGame = useContext(InGameContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openByHover, setOpenByHover] = useState(false);
  const [openByClick, setOpenByClick] = useState(false);
  const popoverOpen = Boolean(anchorEl);

  const handleMouseEnter = (e) => {
    if (!openByClick) {
      setOpenByHover(true);
      openPopover(e);
    }
  };
  const handleMouseLeave = () => {
    if (openByHover) {
      closePopover();
    }
  };
  const handleClick = (e) => {
    setOpenByClick(true);
    setOpenByHover(false);
    openPopover(e);
  };
  const openPopover = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const closePopover = () => {
    setAnchorEl(null);
    setOpenByClick(false);
    setOpenByHover(false);
  };

  // Close on any navigation. A popover anchored to an element on the previous
  // page otherwise lingered after the route changed, pointing at a node that is
  // no longer on screen. Also close when a game takes the screen: the shell
  // stays mounted and keeps the last site location, so that transition is not a
  // navigation it can see, and the popover would float over the game.
  useEffect(() => {
    setAnchorEl(null);
    setOpenByClick(false);
    setOpenByHover(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, inGame]);

  const handleKeyDown = (e) => {
    activateOnEnterOrSpace(e, handleClick);
  };

  const interactiveProps = {
    role: "button",
    tabIndex: 0,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onKeyDown: handleKeyDown,
    "aria-haspopup": "true",
    "aria-expanded": popoverOpen,
  };

  return {
    popoverOpen,
    openByClick,
    anchorEl,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    closePopover,
    interactiveProps,
  };
};
