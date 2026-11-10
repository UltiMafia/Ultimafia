import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";
import { UserContext } from "Contexts";
import { PageNav } from "components/Nav";
import Setup, { SetupManipulationButtons } from "components/Setup";
import { UserSearchSelect } from "components/Form";
import HostGameDialogue from "components/HostGameDialogue";
import { UiAction, UiDialog, UiPending, UiField } from "components/ui";
import { ActiveGameTypes } from "Constants";
import { LatestRequest } from "../../../lib/latestRequest";
import "css/host.css";

const initialFilters = { page: 1, option: "Popular", query: "", minSlots: 1, maxSlots: 50, sortBy: "", creatorId: "", creatorName: "" };
const lists = ["Yours", "Popular", "Favorites", "Featured", "Ranked", "Competitive"];
const sorts = [["", "Default"], ["newest", "Newest"], ["oldest", "Oldest"], ["updated", "Most recently updated"], ["upvoted", "Most upvoted"], ["downvoted", "Most downvoted"], ["controversial", "Most controversial"], ["favorites", "Most favorites"], ["played", "Most played"]];

export default function HostBrowser() {
  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const requestedGame = params.get("game") || localStorage.getItem("gameType") || "Mafia";
  const gameType = ActiveGameTypes.includes(requestedGame) ? requestedGame : "Mafia";
  const [filters, setFilters] = useState(initialFilters);
  const [setups, setSetups] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [selected, setSelected] = useState(null);
  const [hostOpen, setHostOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const favoriteRequests = useRef(new Set());
  const requests = useRef(new LatestRequest());
  const selectionRequests = useRef(new LatestRequest());
  const lastGame = useRef(gameType);
  const requestedSetup = params.get("setup");
  useEffect(() => {
    if (!requestedSetup || !user.loggedIn) return;
    const owner = selectionRequests.current, request = owner.begin();
    axios.get(`/api/setup/${encodeURIComponent(requestedSetup)}`, { signal: request.signal })
      .then(({ data }) => {
        if (!request.isCurrent()) return;
        const setup = { ...data, roles: typeof data.roles === "string" ? JSON.parse(data.roles) : data.roles };
        setSelected(setup); setHostOpen(true);
      })
      .catch(() => { if (request.isCurrent()) setError("Could not open the requested setup. Search for it below or try again."); });
    return () => owner.invalidate();
  }, [requestedSetup, user.loggedIn]);

  useEffect(() => {
    document.title = "Host a game | UltiMafia";
    if (lastGame.current !== gameType) { lastGame.current = gameType; setFilters(initialFilters); }
  }, [gameType]);
  useEffect(() => {
    const owner = requests.current;
    const request = owner.begin();
    setLoading(true); setError("");
    const timer = setTimeout(() => {
      axios.get(`/api/setup/search?${new URLSearchParams({ gameType, ...filters })}`, { signal: request.signal })
        .then(({ data }) => {
          if (!request.isCurrent()) return;
          setSetups(data.setups || []); setPageCount(Math.max(1, data.pages || 1));
        })
        .catch(() => { if (request.isCurrent()) setError("Could not load setups. Your filters have been kept."); })
        .finally(() => { if (request.isCurrent()) setLoading(false); });
    }, 100);
    return () => { clearTimeout(timer); owner.invalidate(); };
  }, [filters, gameType, retry]);

  const change = values => setFilters(previous => ({ ...previous, ...values, page: 1 }));
  function changeGame(value) {
    localStorage.setItem("gameType", value);
    navigate({ pathname: location.pathname, search: new URLSearchParams({ game: value }).toString() }, { replace: true });
  }
  function favorite(setup) {
    if (favoriteRequests.current.has(setup.id)) return;
    favoriteRequests.current.add(setup.id);
    axios.post("/api/setup/favorite", { id: setup.id })
      .then(() => setSetups(previous => previous.map(item => item.id === setup.id ? { ...item, favorite: !item.favorite } : item)))
      .catch(() => setError("Could not update this favorite. Please try again."))
      .finally(() => favoriteRequests.current.delete(setup.id));
  }
  function removeSetup() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    axios.post("/api/setup/delete", { id: deleting.id })
      .then(() => { setDeleting(null); setRetry(value => value + 1); })
      .catch(() => setError("Could not delete this setup. Please try again."))
      .finally(() => setDeleteBusy(false));
  }

  return <div className="host">
    <header className="page-heading"><h1>Host a game</h1><Link className="ui-action ui-action--secondary" to={`/play/create?game=${gameType}`}>Create a setup</Link></header>
    {!user.loggedIn && <p><Link to="/welcome">Sign in</Link> to host or save setups.</p>}
    <div className="host-discovery-controls">
      <UiField select size="small" label="Game type" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={gameType} onChange={event => changeGame(event.target.value)}>{ActiveGameTypes.map(game => <option key={game}>{game}</option>)}</UiField>
      <UiField fullWidth size="small" type="search" label="Search setups or roles" value={filters.query} onChange={event => change({ query: event.target.value })} />
      <UiAction aria-expanded={advanced} aria-controls="host-filters" onClick={() => setAdvanced(value => !value)}>Filters</UiAction>
    </div>
    <div className="host-list-choices" role="group" aria-label="Setup collections">{lists.map(option => <UiAction key={option} variant="ghost" aria-pressed={filters.option === option}
      disabled={!user.loggedIn && ["Yours", "Favorites"].includes(option)} onClick={() => change({ option, query: "", ...(option === "Yours" ? { creatorId: "", creatorName: "" } : {}) })}>{option}</UiAction>)}</div>
    <div id="host-filters" className="host-filter-fields" hidden={!advanced}>
      <UiField fullWidth size="small" type="number" label="Min slots" value={filters.minSlots} inputProps={{ min: 1, max: filters.maxSlots }} onChange={event => change({ minSlots: Math.max(1, Math.min(filters.maxSlots, Number(event.target.value) || 1)) })} />
      <UiField fullWidth size="small" type="number" label="Max slots" value={filters.maxSlots} inputProps={{ min: filters.minSlots, max: 50 }} onChange={event => change({ maxSlots: Math.min(50, Math.max(filters.minSlots, Number(event.target.value) || 50)) })} />
      <UiField select size="small" label="Sort by" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={filters.sortBy} onChange={event => change({ sortBy: event.target.value })}>{sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</UiField>
      <UserSearchSelect value={filters.creatorName} placeholder="Filter by creator" onChange={(id, name) => change({ creatorId: id || "", creatorName: name || "" })} />
      <UiAction onClick={() => setFilters(initialFilters)}>Reset filters</UiAction>
    </div>
    {error && <div role="alert" className="host-error"><p>{error}</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
    <p className="host-results-summary" role="status">{loading ? "Loading setups…" : `${setups.length} setups on this page · Page ${filters.page} of ${pageCount}`}</p>
    {loading && !setups.length && <UiPending label="Loading setups" />}
    <ul className="host-setup-list" aria-label="Setups" aria-busy={loading}>{setups.map(setup => <li key={setup.id} className="host-setup-row">
      <div className="host-setup-information"><Setup setup={setup} summary /></div>
      <div className="host-setup-actions"><Link to={`/learn/setup/${setup.id}`}>Details</Link>{user.loggedIn && <UiAction variant="primary" onClick={() => { setSelected(setup); setHostOpen(true); }}>Host</UiAction>}</div>
      <div className="host-setup-secondary"><p className="host-setup-facts">{setup.gameType} · {setup.total} players{setup.competitive ? " · Competitive" : setup.ranked ? " · Ranked" : ""}</p>{user.loggedIn && <div className="host-setup-tools"><SetupManipulationButtons setup={setup} onFav={favorite} onDel={setDeleting} showLabels /></div>}</div>
    </li>)}</ul>
    {!loading && !error && !setups.length && <div role="status"><h2>No matching setups</h2><p>Try another name, collection or player range.</p><UiAction onClick={() => setFilters(initialFilters)}>Reset filters</UiAction></div>}
    <PageNav page={filters.page} maxPage={pageCount} onNav={page => setFilters(previous => ({ ...previous, page }))} />
    {selected && <HostGameDialogue key={selected.id} open={hostOpen} setOpen={setHostOpen} setup={selected} preSelectedDeck={params.get("deck")} preSelectedWordDeck={params.get("wordDeck")} />}
    <UiDialog open={!!deleting} title="Delete setup?" onClose={deleteBusy ? undefined : () => setDeleting(null)}
      actions={<><UiAction disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</UiAction><UiAction variant="danger" busy={deleteBusy} onClick={removeSetup}>Delete setup</UiAction></>}>
      <p>Delete {deleting?.name}? This cannot be undone.</p>
    </UiDialog>
  </div>;
}
