import React, { useState, useContext } from "react";
import {
  Box,
  Tooltip,
  Typography,
  Collapse,
  IconButton,
} from "@mui/material";
import { SiteInfoContext } from "Contexts";
import { RoleCount } from "components/Roles";
import { PageNav } from "components/Nav";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import "css/scrapbook.css";

const STAMPS_PER_PAGE = 22;

function StampItem({ gameType, role, count }) {
  const label = gameType === "Mafia" ? role : `${gameType} - ${role}`;

  return (
    <Tooltip title={label} arrow>
      <div className="stamp">
        <div className="stamp-icon">
          <RoleCount role={role} gameType={gameType} small showPopover={false} />
        </div>
        <div className="stamp-fold" />
        {count > 1 && (
          <div className={`stamp-badge${count > 99 ? " star" : ""}`}>
            {count > 99 ? "\u2605" : count}
          </div>
        )}
      </div>
    </Tooltip>
  );
}

export default function Scrapbook({
  stamps = [],
  hiddenStamps = [],
  isSelf = false,
  panelStyle = {},
  headingStyle = {},
}) {
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const siteInfo = useContext(SiteInfoContext);
  const hasVisible = stamps.length > 0;
  const hasHidden = hiddenStamps.length > 0;

  if (!hasVisible && !hasHidden) return null;

  // Count unique stamp types across visible and hidden
  const uniqueRoles = new Set();
  for (const s of stamps) uniqueRoles.add(`${s.gameType}:${s.role}`);
  for (const s of hiddenStamps) uniqueRoles.add(`${s.gameType}:${s.role}`);
  const uniqueCount = uniqueRoles.size;
  const totalRoles = Object.keys(siteInfo?.rolesRaw?.["Mafia"] || {}).length;

  const maxPage = Math.max(Math.ceil(stamps.length / STAMPS_PER_PAGE), 1);
  const pageStamps = stamps.slice(
    (page - 1) * STAMPS_PER_PAGE,
    page * STAMPS_PER_PAGE
  );

  return (
    <div className="box-panel scrapbook-panel" style={panelStyle}>
      <Typography variant="h3" style={headingStyle}>
        Scrapbook {totalRoles > 0 && `(${uniqueCount}/${totalRoles})`}
      </Typography>
      <div className="content">
        {hasVisible ? (
          <>
            <Box className="scrapbook-grid">
              {pageStamps.map((s) => (
                <StampItem
                  key={`${s.gameType}:${s.role}`}
                  gameType={s.gameType}
                  role={s.role}
                  count={s.count}
                />
              ))}
            </Box>
            {maxPage > 1 && (
              <PageNav
                inverted
                page={page}
                maxPage={maxPage}
                onNav={setPage}
              />
            )}
          </>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No stamps yet
          </Typography>
        )}
        {isSelf && hasHidden && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                opacity: 0.7,
              }}
              onClick={() => setShowHidden(!showHidden)}
            >
              <Typography variant="body2" color="textSecondary">
                Hidden ({hiddenStamps.reduce((sum, s) => sum + s.count, 0)})
              </Typography>
              <IconButton size="small">
                {showHidden ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
            <Collapse in={showHidden}>
              <Box className="scrapbook-grid" sx={{ mt: 0.5 }}>
                {hiddenStamps.map((s) => (
                  <StampItem
                    key={`hidden-${s.gameType}:${s.role}`}
                    gameType={s.gameType}
                    role={s.role}
                    count={s.count}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </div>
    </div>
  );
}
