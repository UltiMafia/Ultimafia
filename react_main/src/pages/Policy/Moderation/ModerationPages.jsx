import React from "react";
import { useOutletContext } from "react-router-dom";
import { ModCommands } from "./ModCommands";
import { ModActions } from "./ModActions";
import { GroupPanels } from "./GroupPanels";

export function ModerationGroups() {
  const { user } = useOutletContext() || {};
  return <section className="moderation-groups-page">
    <header className="moderation-section-heading"><h2>Staff groups</h2><p>Review who holds each staff role. Group changes require the matching permission.</p></header>
    <GroupPanels user={user} />
  </section>;
}

export function ModerationTools() {
  const { results = "", setResults = () => {}, user } = useOutletContext() || {};
  return <section className="moderation-tools-page">
    <header className="moderation-section-heading"><h2>Run a moderation action</h2><p>Search for a command, fill its fields and execute it. Every action is recorded in the moderation log.</p></header>
    {user?.perms?.viewModActions ? <>
      <ModCommands results={results} setResults={setResults} />
      {results && <div className="moderation-command-result">{results}</div>}
    </> : <p>You do not have permission to run moderation actions.</p>}
  </section>;
}

export function ModerationRecent() {
  const { setResults = () => {} } = useOutletContext() || {};
  return <section className="moderation-recent-page">
    <header className="moderation-section-heading"><h2>Recent actions</h2><p>Search and review the moderation action log.</p></header>
    <ModActions setResults={setResults} />
  </section>;
}
