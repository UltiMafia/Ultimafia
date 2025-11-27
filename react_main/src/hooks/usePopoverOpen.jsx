import { useState } from "react";

export const usePopoverOpen = () => {
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

  return {
    popoverOpen,
    openByClick,
    anchorEl,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    closePopover,
  };
};
