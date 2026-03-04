import React, { useContext, useState, useMemo } from "react";
import "css/play.css";
import "css/achievements.css";
import {
  Typography,
  Popover,
  Stack,
  Divider,
} from "@mui/material";
import { SiteInfoContext } from "../Contexts";
import { CellSearch, Cell } from "./CellSearch";
import CasePanel from "./CasePanel";
import { usePopoverOpen } from "../hooks/usePopoverOpen";

const COIN_ICON = require("images/umcoin.png");

function AchievementCount({ item }) {
  const internal = item.internal?.[0] ?? "";
  const {
    popoverOpen,
    openByClick,
    anchorEl,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    closePopover,
  } = usePopoverOpen();

  return (
    <>
      <div
        className={`achievement-icon ${internal}`}
        aria-owns={popoverOpen ? `achievement-popover-${item.name.replace(/\s/g, "-")}` : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: "1.875rem",
          height: "1.875rem",
          cursor: "pointer",
        }}
      />
      <Popover
        id={`achievement-popover-${item.name.replace(/\s/g, "-")}`}
        open={popoverOpen}
        sx={{ pointerEvents: openByClick ? "auto" : "none" }}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={closePopover}
        disableScrollLock
        disableRestoreFocus
      >
        <div className="mui-popover">
          <div className="mui-popover-title">
            <Stack direction="row" spacing={1} sx={{ p: 1, alignItems: "center" }}>
              <span className={`achievement-icon ${internal}`} />
              <Typography variant="h2" sx={{ fontWeight: "bold", textDecoration: "underline" }}>
                {item.name}
              </Typography>
            </Stack>
          </div>
          <Stack
            direction="column"
            spacing={1}
            divider={<Divider orientation="horizontal" flexItem />}
            sx={{ p: 1 }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <i className="fas fa-info-circle" />
              <Typography>{item.description ?? ""}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <img
                src={COIN_ICON}
                className="um-coin"
                alt=""
                style={{ width: "1rem", height: "1rem" }}
              />
              <Typography>
                <span style={{ fontWeight: "bold" }}>Reward</span>: {item.reward ?? 0} coins
              </Typography>
            </Stack>
          </Stack>
        </div>
      </Popover>
    </>
  );
}

function resolveAchievementItems(achievementIds = [], achievementData = {}) {
  if (!achievementData || !Array.isArray(achievementIds)) return [];
  const entries = Object.entries(achievementData);
  return achievementIds
    .map((achID) => {
      const found = entries.find(([, data]) => data && data.ID === achID);
      if (!found) return null;
      const [name, data] = found;
      return { name, ...data };
    })
    .filter(Boolean);
}

export function AchievementPanel({
  achievements = [],
  panelStyle = {},
  headingStyle = {},
  className = "box-panel achievements",
}) {
  const siteInfo = useContext(SiteInfoContext);
  const achievementData = siteInfo.achievementsRaw?.Mafia || {};
  const items = useMemo(
    () => resolveAchievementItems(achievements, achievementData),
    [achievements, achievementData]
  );

  return (
    <CasePanel
      title="Achievements"
      panelStyle={panelStyle}
      headingStyle={headingStyle}
      className={className}
      emptyMessage="No achievements yet"
    >
      {items.map((item) => (
        <AchievementCount key={item.name} item={item} />
      ))}
    </CasePanel>
  );
}

export function AchievementSearch() {
  const siteInfo = useContext(SiteInfoContext);
  const [searchVal, setSearchVal] = useState("");

  const achievementData = siteInfo.achievementsRaw?.Mafia || {};
  const items = useMemo(() => {
    const entries = Object.entries(achievementData).map(([name, data]) => ({
      name,
      ...data,
    }));
    const filtered = !searchVal.trim()
      ? entries
      : entries.filter(
          (item) =>
            item.name.toLowerCase().includes(searchVal.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchVal.toLowerCase()))
        );
    return filtered.sort((a, b) => (a.reward ?? 0) - (b.reward ?? 0));
  }, [achievementData, searchVal]);

  return (
    <CellSearch
      tabs={[]}
      searchPlaceholder="🔎 Search"
      searchVal={searchVal}
      onSearchInput={(query) => setSearchVal(query)}
      items={items}
      getItemKey={(item) => item.name}
      getItemName={(item) => item.name}
      renderIcon={(item) => <AchievementCount item={item} />}
      renderCell={(item, icon) => <Cell item={item} icon={icon} />}
      gridColumns={{ xs: 4, sm: 6, md: 8 }}
    />
  );
}
