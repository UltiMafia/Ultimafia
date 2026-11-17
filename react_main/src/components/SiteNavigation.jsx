import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../Contexts";
import { IOS_BETA_URL } from "../constants/iosBeta";
import UiIcon from "./ui/UiIcon";

const primary = [
  ["Games", "/play", "games"],
  ["Community", "/community/forums", "chat"],
  ["Players", "/community/users", "people"],
  ["Learn", "/learn/games", "book"],
  ["Rankings", "/fame/hall-of-fame", "rankings"],
];

const play = [
  ["Host a game", "/play/host", "add"],
  ["Create setup", "/play/create", "document"],
  ["Competitive", "/fame/competitive", "trophy"],
  ["Stock market", "/fame/stocks", "coins"],
];

const more = [
  ["Families", "/community/families", "people"],
  ["Feedback", "/community/feedback", "messageOptions"],
  ["Activity", "/activity/livefeed", "clock"],
  ["Metrics", "/activity/metrics", "rankings"],
  ["Contributors", "/fame/contributors", "people"],
  ["Donors", "/fame/donors", "heart"],
  ["Character decks", "/play/decks", "inventory"],
  ["Word decks", "/play/wordDecks", "document"],
  ["Moderation", "/policy/moderation", "moderation"],
];

function NavigationLink({ label, path, icon }) {
  const { pathname } = useLocation();
  const matchPath = path === "/learn/games" ? "/learn" : path === "/fame/hall-of-fame" ? "/fame" : path;
  const active = pathname === matchPath || (path !== "/play" && pathname.startsWith(matchPath + "/"));
  return <Link to={path} aria-current={active ? "page" : undefined} className={`site-navigation-link${active ? " is-current" : ""}`}>
    {icon && <UiIcon name={icon} size={24} />}
    <span>{label}</span>
  </Link>;
}

export default function SiteNavigation() {
  const user = useContext(UserContext);
  const owner = user.groups?.some(group => group?.name === "Owner");
  return (
    <nav className="site-navigation" aria-label="Site navigation">
      <div className="site-navigation-primary">
        {primary.map(([label, path, icon]) => <NavigationLink key={path} label={label} path={path} icon={icon} />)}
      </div>
      <div className="site-navigation-group">
        <span className="site-navigation-label">Play</span>
        {play.map(([label, path, icon]) => <NavigationLink key={path} label={label} path={path} icon={icon} />)}
      </div>
      <div className="site-navigation-group">
        <span className="site-navigation-label">More</span>
        {more.map(([label, path, icon]) => <NavigationLink key={path} label={label} path={path} icon={icon} />)}
        {owner && <NavigationLink label="Invoices" path="/policy/invoices" icon="document" />}
        {IOS_BETA_URL && <a className="site-navigation-link" href={IOS_BETA_URL} target="_blank" rel="noopener noreferrer"><UiIcon name="external" size={24} /><span>iOS app (beta)</span></a>}
      </div>
      <div className="site-navigation-help">
        <NavigationLink label="Tutorial" path="/play/tutorial" icon="help" />
        <NavigationLink label="Glossary" path="/learn/glossary" icon="book" />
        <NavigationLink label="Rules" path="/policy/rules" icon="document" />
      </div>
    </nav>
  );
}
