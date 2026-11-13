import React, { useState, useMemo, useEffect, useContext } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Link,
} from "@mui/material";

import { RoleSearch, ModifierSearch, GameSettingSearch } from "components/Roles";
import { AchievementSearch } from "components/Achievements";
import { ActiveGameTypes, DisabledGameTypes } from "Constants";
import GameIcon from "components/GameIcon";
import { SiteInfoContext } from "Contexts";
import { hyphenDelimit } from "utils";
import { UiPageHeader, UiField, UiMenuItem, UiReferenceList, UiReferenceEntry, UiText as Typography, UiTabs as Tabs, UiTab as Tab } from "components/ui";

const TAB_IDS = ["roles", "modifiers", "items", "mechanics", "achievements"];
const TAB_LABELS = {
  roles: "Roles",
  modifiers: "Modifiers",
  items: "Items",
  mechanics: "Mechanics",
  achievements: "Achievements",
};

function LearnRichDescription({ description }) {
  if (!description?.length) return null;

  return (
    <>
      {description.map((block, idx) => {
        if (block.type === "paragraph") {
          if (block.parts?.length) {
            return (
              <Typography key={idx} variant="body1" paragraph component="div">
                {block.parts.map((part, j) => {
                  if (part.type === "text") {
                    return <React.Fragment key={j}>{part.content}</React.Fragment>;
                  }
                  if (part.type === "link") {
                    return (
                      <Link
                        key={j}
                        href={part.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                      >
                        {part.label}
                      </Link>
                    );
                  }
                  if (part.type === "routerLink") {
                    return (
                      <Link key={j} component={RouterLink} to={part.to}>
                        {part.label}
                      </Link>
                    );
                  }
                  return null;
                })}
              </Typography>
            );
          }
          return (
            <Typography key={idx} variant="body1" paragraph>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "subheading") {
          return (
            <Typography key={idx} variant="h6" gutterBottom>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "list") {
          return (
            <Box
              key={idx}
              component="ul"
              sx={{
                pl: 3,
                mb: 2,
                "& li": { typography: "body1" },
              }}
            >
              {block.items.map((item, j) => (
                <Box component="li" key={j} sx={{ mb: 0.5 }}>
                  {typeof item === "string" ? (
                    item
                  ) : (
                    <>
                      <Typography component="span" fontWeight="bold">
                        {item.strong}
                      </Typography>
                      {item.text}
                    </>
                  )}
                </Box>
              ))}
            </Box>
          );
        }
        return null;
      })}
    </>
  );
}

function LearnTabsLayout({
  children,
  rolesContent,
  modifiersContent = null,
  itemsContent = null,
  mechanicsContent = null,
  achievementsContent = null,
}) {
  const enabledTabs = useMemo(() => {
    const out = [];
    if (rolesContent != null) out.push("roles");
    if (modifiersContent != null) out.push("modifiers");
    if (itemsContent != null) out.push("items");
    if (mechanicsContent != null) out.push("mechanics");
    if (achievementsContent != null) out.push("achievements");
    return out;
  }, [rolesContent, modifiersContent, itemsContent, mechanicsContent, achievementsContent]);

  const [activeTab, setActiveTab] = useState(() => enabledTabs[0] || "roles");

  useEffect(() => {
    if (enabledTabs.length && !enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0]);
    }
  }, [enabledTabs, activeTab]);

  const value = enabledTabs.includes(activeTab) ? activeTab : enabledTabs[0] || "roles";
  const handleChange = (_, newValue) => {
    if (enabledTabs.includes(newValue)) setActiveTab(newValue);
  };

  return (
    <div className="learn">
      {children}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Tabs aria-label="Reference sections" value={value} onChange={handleChange}>
          {TAB_IDS.map((id) => (
            <Tab
              key={id}
              label={TAB_LABELS[id]}
              value={id}
              id={`learn-section-${id}`}
              aria-controls={`learn-tab-${id}`}
              disabled={!enabledTabs.includes(id)}
            />
          ))}
        </Tabs>
      </Box>
      <Box role="tabpanel" hidden={value !== "roles"} id="learn-tab-roles" aria-labelledby="learn-section-roles">
        {value === "roles" && rolesContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "modifiers"} id="learn-tab-modifiers" aria-labelledby="learn-section-modifiers">
        {value === "modifiers" && modifiersContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "items"} id="learn-tab-items" aria-labelledby="learn-section-items">
        {value === "items" && itemsContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "mechanics"} id="learn-tab-mechanics" aria-labelledby="learn-section-mechanics">
        {value === "mechanics" && mechanicsContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "achievements"} id="learn-tab-achievements" aria-labelledby="learn-section-achievements">
        {value === "achievements" && achievementsContent}
      </Box>
    </div>
  );
}

function LearnGamePanel({ gameType, Layout }) {
  const siteInfo = useContext(SiteInfoContext);
  const learnGameDescriptionByType = siteInfo.learnGameDescriptionByType || {};

  const items = useMemo(() => {
    if (gameType !== "Mafia") return [];
    const gameItems = siteInfo.items?.[gameType] || [];
    return gameItems.map((entry) => {
      const iconName = entry.icon || entry.name;
      const iconClass = `icon item item-${gameType}-${hyphenDelimit(iconName)}`;
      return {
        name: entry.name,
        text: entry.description,
        icon: <div className={iconClass} />,
      };
    });
  }, [siteInfo.items, gameType]);

  useEffect(() => {
    document.title = `Learn ${gameType} | UltiMafia`;
  }, [gameType]);

  const description = learnGameDescriptionByType[gameType] ?? [];

  const renderItems = data => <UiReferenceList label="Items" items={data} getItemKey={entry => entry.name}
    renderEntry={entry => <UiReferenceEntry name={entry.name} icon={entry.icon} description={entry.text} />} />;

  let layoutProps = {
    rolesContent: <RoleSearch gameType={gameType} />,
  };

  if (gameType === "Mafia") {
    layoutProps = {
      ...layoutProps,
      modifiersContent: <ModifierSearch gameType={gameType} />,
      itemsContent: renderItems(items),
      mechanicsContent: <GameSettingSearch gameType={gameType} curMods={{}} />,
      achievementsContent: (
        <Box sx={{ pt: 2 }}>
          <AchievementSearch />
        </Box>
      ),
    };
  }

  return (
    <Layout {...layoutProps}>
      <LearnRichDescription description={description} />
    </Layout>
  );
}

export default function Games(props) {
  const defaultGameType = "Mafia";
  const siteInfo = useContext(SiteInfoContext);
  const learnGameDescriptionByType = siteInfo.learnGameDescriptionByType || {};
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestedGameType =
    params.get("game") || localStorage.getItem("gameType") || defaultGameType;
  const [gameType, setGameType] = useState(() => {
    if (DisabledGameTypes.includes(requestedGameType)) return defaultGameType;
    if (!learnGameDescriptionByType[requestedGameType]) return defaultGameType;
    return requestedGameType;
  });

  const panelGameType =
    DisabledGameTypes.includes(gameType) || learnGameDescriptionByType[gameType] == null
      ? defaultGameType
      : gameType;

  useEffect(() => {
    if (panelGameType !== gameType) {
      setGameType(panelGameType);
    }
  }, [panelGameType, gameType]);

  const handleGameChange = (event) => {
    const newValue = event.target.value;
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
  };

  return (
    <>
      <UiPageHeader title="Learn" variant="editor" actions={
          <UiField select size="small" label="Game" value={gameType} onChange={handleGameChange} SelectProps={{ renderValue: value => <span className="ui-action-row"><GameIcon gameType={value} size={24} />{value}</span> }}>
            {ActiveGameTypes.map((game) => (
              <UiMenuItem key={game} value={game}>
                <span className="ui-action-row">
                  <GameIcon gameType={game} size={24} />
                  {game}
                </span>
              </UiMenuItem>
            ))}
          </UiField>
      } />
      <Box>
        <LearnGamePanel gameType={panelGameType} Layout={LearnTabsLayout} />
      </Box>
    </>
  );
}
