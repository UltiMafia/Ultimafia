import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { SiteInfoContext, UserContext } from "Contexts";
import { UiAction, UiIcon, UiPending, UiField, UiCheckbox, UiPageHeader } from "components/ui";
import { NameWithAvatar } from "../User/UserWidgets";
import { CoinAmount } from "../User/FamilyExtras";
import { FamilyAvatarImage } from "utils/avatarUrl";
import { LatestRequest } from "../../lib/latestRequest";
import "css/directories.css";

function FamilyAvatar({ family }) {
  const siteInfo = useContext(SiteInfoContext);
  if (typeof family.avatar === "string") return <img src={family.avatar} alt="" width="64" height="64" style={{ objectFit: "cover", borderRadius: "50%" }} />;
  if (family.avatar) return <FamilyAvatarImage id={family.id} size={64} cacheVal={siteInfo.cacheVal} />;
  return <span aria-hidden="true" style={{ width: 64, height: 64, display: "grid", placeItems: "center" }}><UiIcon name="people" /></span>;
}

function FamilyRow({ family }) {
  return <li className="family-directory-row">
    <FamilyAvatar family={family} />
    <div className="family-directory-copy">
      <h2><Link to={`/user/family/${family.id}`}>{family.name}</Link></h2>
      <div className="family-directory-facts">
        <span className={`family-application-status${family.applicationsOpen ? " is-open" : ""}`}>{family.applicationsOpen ? "Applications open" : "Applications closed"}</span>
        <span>{family.memberCount} / {family.memberLimit} members</span>
      </div>
      {family.bioPreview && <p>{family.bioPreview}</p>}
      {family.leader && <p className="directory-summary">Led by <NameWithAvatar {...family.leader} small /></p>}
      <div className="family-directory-facts">
        <span>Treasury <CoinAmount amount={family.treasury} /></span>
        <span>{family.trophyCount} trophies</span><span>{family.perkCount} perks</span>
      </div>
    </div>
    <Link className="ui-action ui-action--secondary" to={`/user/family/${family.id}`}>View family</Link>
  </li>;
}

export default function FamilyDiscovery() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("members");
  const [openOnly, setOpenOnly] = useState(false);
  const [total, setTotal] = useState(0);
  const [retry, setRetry] = useState(0);
  const requests = useRef(new LatestRequest());
  const user = useContext(UserContext);
  useEffect(() => { document.title = "Families | UltiMafia"; }, []);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    const owner = requests.current;
    const request = owner.begin();
    setLoading(true); setFailed(false);
    axios.get("/api/family/discover", { params: { search, sort, openOnly }, signal: request.signal })
      .then(({ data }) => {
        if (!request.isCurrent()) return;
        setFamilies(data.families || []); setTotal(data.total || 0);
      })
      .catch(() => { if (request.isCurrent()) setFailed(true); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
    return () => owner.invalidate();
  }, [search, sort, openOnly, retry]);
  const clear = () => { setSearchInput(""); setSearch(""); setOpenOnly(false); setSort("members"); };

  return <div className="family-directory">
    <UiPageHeader title="Families" actions={
      <Link className="ui-action ui-action--secondary" to={user.loggedIn ? "/user/settings/family" : "/welcome"}>{user.loggedIn ? "Manage or create family" : "Sign in to join"}</Link>
    } />
    <form className="directory-toolbar" onSubmit={event => { event.preventDefault(); setSearch(searchInput.trim()); }}>
      <UiField size="small" label="Search families" type="search" inputProps={{ maxLength: 40 }} value={searchInput} onChange={event => setSearchInput(event.target.value)} />
      <UiField select size="small" label="Sort by" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={sort} onChange={event => setSort(event.target.value)}>
        <option value="open">Open first</option><option value="members">Most members</option><option value="treasury">Most treasury</option><option value="newest">Newest</option>
      </UiField>
      <label className="directory-checkbox"><UiCheckbox checked={openOnly} onChange={event => setOpenOnly(event.target.checked)} />Open only</label>
    </form>
    <p className="directory-summary" role="status">{loading ? "Loading families…" : failed ? "Families unavailable" : `${total.toLocaleString()} families found`}</p>
    {failed && <div role="alert"><p>Could not load families.</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
    {loading && !families.length && <UiPending label="Loading families" />}
    <ul className="family-directory-list" aria-label="Families" aria-busy={loading}>{families.map(family => <FamilyRow key={family.id} family={family} />)}</ul>
    {!loading && !failed && !families.length && <div role="status"><p>No families found.</p><UiAction onClick={clear}>Clear filters</UiAction></div>}
  </div>;
}
