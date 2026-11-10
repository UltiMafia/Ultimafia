import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { UserContext, SiteInfoContext } from "Contexts";
import { UiAction, UiDialog, UiField, UiIcon, UiPending } from "components/ui";
import { PageNav } from "components/Nav";
import { VoteWidget } from "components/VoteWidget";
import AnonymousDeck from "components/Deck";
import { filterProfanity } from "components/Basic";
import { LatestRequest } from "../../../lib/latestRequest";
import "css/deck.css";

function DeckCover({ src }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="deck-library-cover deck-library-cover--placeholder" aria-hidden="true"><UiIcon name="document" size={24} /></div>;
  return <img className="deck-library-cover" src={src} alt="" onError={() => setFailed(true)} />;
}

export default function DeckLibrary({ words = false }) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const location = useLocation();
  const api = words ? "wordDeck" : "deck";
  const editor = words ? "createWordDeck" : "createDeck";
  const title = words ? "Word decks" : "Character decks";
  const sourceId = new URLSearchParams(location.search).get("deck");
  const [collection, setCollection] = useState(sourceId ? "id" : "featured");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [slots, setSlots] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const requests = useRef(new LatestRequest());
  useEffect(() => { document.title = `${title} | UltiMafia`; }, [title]);
  useEffect(() => {
    if (!user.loggedIn) return;
    let cancelled = false;
    axios.get(`/api/${api}/slots/info`).then(({ data }) => { if (!cancelled) setSlots(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [api, user.loggedIn]);
  useEffect(() => {
    const owner = requests.current, request = owner.begin();
    setLoading(true); setError("");
    const timer = setTimeout(() => {
      const query = collection === "id" ? sourceId : search;
      axios.get(`/api/${api}/${search ? "search" : collection}?${new URLSearchParams({ page, query: query || "" })}`, { signal: request.signal })
        .then(({ data }) => { if (request.isCurrent()) { setDecks(data.decks || []); setPages(data.pages || 1); } })
        .catch(() => { if (request.isCurrent()) setError("Could not load decks. Please try again."); })
        .finally(() => { if (request.isCurrent()) setLoading(false); });
    }, 150);
    return () => { clearTimeout(timer); owner.invalidate(); };
  }, [api, search, collection, page, sourceId, retry]);
  function remove() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    axios.post(`/api/${api}/delete`, { id: deleting.id })
      .then(() => { setDeleting(null); setRetry(value => value + 1); })
      .catch(() => setError("Could not delete this deck. Please try again."))
      .finally(() => setDeletingBusy(false));
  }
  async function copy(id) {
    try { await navigator.clipboard.writeText(id); siteInfo.showAlert("Copied deck ID", "success"); }
    catch { setError("Could not copy the deck ID. Clipboard access may be unavailable."); }
  }
  return <div className="deck-library">
    <header className="page-heading"><h1>{title}</h1><Link className="ui-action ui-action--primary" to={user.loggedIn ? `/play/${editor}` : "/welcome"}>{user.loggedIn ? "Create deck" : "Sign in to create"}</Link></header>
    <p>{words ? "Browse word lists for Draw It." : "Browse anonymous character names and avatars for games."}</p>
    <div className="deck-library-toolbar"><div role="group" aria-label="Deck collections">{["featured", "popular", "yours"].map(value => <UiAction key={value} variant="ghost" aria-pressed={collection === value && !search} disabled={value === "yours" && !user.loggedIn} onClick={() => { setCollection(value); setSearch(""); setPage(1); }}>{value[0].toUpperCase() + value.slice(1)}</UiAction>)}</div>
      <UiField type="search" label="Search decks" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
    </div>
    {slots && <p className="directory-summary">{slots.owned} / {slots.purchased} deck slots used · <Link to={`/user/shop?buy=${words ? "wordDeck" : "anonymousDeck"}`}>Buy more slots</Link></p>}
    {error && <div role="alert"><p>{error}</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
    {loading && !decks.length && <UiPending label="Loading decks" />}
    <ul className="deck-library-list" aria-label={title} aria-busy={loading}>{decks.map(deck => <li key={deck.id} className="deck-library-row">
      {!words && user.loggedIn && <VoteWidget item={deck} itemType="deck" itemHolder={decks} setItemHolder={setDecks} />}
      {words && <DeckCover src={deck.coverPhoto ? `/uploads${deck.coverPhoto}?t=${siteInfo.cacheVal}` : ""} />}
      <div className="deck-library-description">{words ? <>
        <h2>{filterProfanity(deck.name || "", user.settings)}</h2>
        {deck.description && <p>{filterProfanity(deck.description, user.settings)}</p>}
        <p className="directory-summary">{deck.wordCount || 0} words · {(deck.wordPreview || []).slice(0, 5).join(", ")}</p>
      </> : <AnonymousDeck deck={deck} />}</div>
      <div className="deck-library-actions">{user.loggedIn && <>
        <Link className="ui-action ui-action--secondary" to={`/play/host?${new URLSearchParams(words ? { game: "Draw It", wordDeck: deck.id } : { deck: deck.id })}`}>Host with deck</Link>
        <UiAction variant="ghost" onClick={() => copy(deck.id)}>Copy ID</UiAction>
        {collection === "yours" && !deck.isDefault && <><Link className="ui-action ui-action--secondary" to={`/play/${editor}?edit=${deck.id}`}>Edit</Link><UiAction variant="danger-quiet" onClick={() => setDeleting(deck)}>Delete</UiAction></>}
      </>}</div>
    </li>)}</ul>
    {!loading && !error && !decks.length && <p role="status">No decks found. Try another name or collection.</p>}
    <PageNav page={page} maxPage={pages} onNav={setPage} />
    <UiDialog open={!!deleting} title="Delete deck?" onClose={deletingBusy ? undefined : () => setDeleting(null)} actions={<><UiAction disabled={deletingBusy} onClick={() => setDeleting(null)}>Cancel</UiAction><UiAction variant="danger" busy={deletingBusy} onClick={remove}>Delete deck</UiAction></>}><p>Delete {deleting?.name}? This cannot be undone.</p></UiDialog>
  </div>;
}
