import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import axios from "axios";
import { Loading } from "../Loading";
import { LatestRequest } from "../../lib/latestRequest";
import { useViewActive } from "../../hooks/useViewActivity";
import { useDismissOnBack } from "../../hooks/useDismissOnBack";
import { urlifyText } from "../../utilsFolder";

// The existing announcements endpoint returns descending batches of five.
const PAGE_SIZE = 5;
const SEEN_KEY = "lastSeenAnnouncementDate";

function readSeenDate() {
  try { return localStorage.getItem(SEEN_KEY); } catch { return null; }
}

export function Announcement({ showAnnouncementTemporarily, setShowAnnouncementTemporarily }) {
  const [announcements, setAnnouncements] = useState([]);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const requests = useRef(new LatestRequest());
  const cached = useRef([]);
  const selectionVersion = useRef(0);
  const retry = useRef({});
  const active = useViewActive();
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  const loadPage = useCallback(async (lastDate, append = false, targetIndex = 0, version = selectionVersion.current) => {
    const request = requests.current.begin();
    retry.current = { lastDate, append, targetIndex };
    setLoading(true);
    setError(false);
    try {
      const query = lastDate === undefined ? "" : `?last=${encodeURIComponent(lastDate)}`;
      const response = await axios.get(`/api/mod/announcements${query}`, { signal: request.signal });
      if (!request.isCurrent()) return;
      if (!Array.isArray(response.data)) throw new Error("Invalid announcement response");
      const previous = append ? cached.current : [];
      const ids = new Set(previous.map(item => item.id || item.date));
      const additions = response.data.filter(item => !ids.has(item.id || item.date));
      cached.current = previous.concat(additions);
      setAnnouncements(cached.current);
      setHasMore(response.data.length >= PAGE_SIZE);
      if (version === selectionVersion.current && (!append || additions.length)) setIndex(targetIndex);
      if (!append) setSeen(readSeenDate() === String(cached.current[0]?.date));
    } catch {
      if (request.isCurrent() && version === selectionVersion.current) setError(true);
    } finally {
      if (request.isCurrent()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const owner = requests.current;
    loadPage();
    return () => owner.invalidate();
  }, [loadPage]);

  const openDialog = useCallback(() => {
    selectionVersion.current++;
    setIndex(0);
    setError(false);
    setOpen(true);
    if (!cached.current.length && !loading) loadPage();
  }, [loading, loadPage]);

  const closeDialog = useCallback(() => {
    selectionVersion.current++;
    setOpen(false);
    setShowAnnouncementTemporarily(false);
    if (cached.current.length) {
      try { localStorage.setItem(SEEN_KEY, String(cached.current[0].date)); } catch { /* Session-only dismissal if storage is unavailable. */ }
      setSeen(true);
    }
  }, [setShowAnnouncementTemporarily]);

  useDismissOnBack(open && active, closeDialog);
  useEffect(() => {
    if (active && showAnnouncementTemporarily) {
      openDialog();
      setShowAnnouncementTemporarily(false);
    }
  }, [active, showAnnouncementTemporarily, openDialog, setShowAnnouncementTemporarily]);
  useEffect(() => {
    if (!active || previousPath.current !== location.pathname) {
      selectionVersion.current++;
      setOpen(false);
    }
    previousPath.current = location.pathname;
  }, [active, location.pathname]);

  function older() {
    const version = ++selectionVersion.current;
    if (index + 1 < announcements.length) setIndex(index + 1);
    else loadPage(announcements[announcements.length - 1]?.date, true, index + 1, version);
  }
  function newer() {
    selectionVersion.current++;
    setIndex(index - 1);
  }
  const current = announcements[index];

  return <>
    {!seen && announcements.length > 0 && <div className="announcement-notice">
      <button className="announcement-summary" type="button" onClick={openDialog} aria-haspopup="dialog" aria-label="Read announcement">
        <i className="fas fa-bullhorn" aria-hidden="true" />
        <span className="announcement-preview">{announcements[0].content}</span>
        <span className="announcement-read">Read</span>
      </button>
      <button className="utility-button" type="button" onClick={closeDialog} aria-label="Dismiss announcement"><i className="fas fa-times" aria-hidden="true" /></button>
    </div>}
    <Dialog open={open && active} onClose={closeDialog} fullWidth maxWidth="sm" aria-labelledby="announcement-title">
      <DialogTitle id="announcement-title" sx={{ fontSize: 18, fontWeight: 600 }}>Announcements</DialogTitle>
      <DialogContent dividers aria-busy={loading}>
        {error && <Alert severity="error" action={<Button onClick={() => {
          const request = retry.current;
          loadPage(request.lastDate, request.append, request.targetIndex, ++selectionVersion.current);
        }}>Retry</Button>}>Could not load announcements.</Alert>}
        {loading && !current ? <Loading small /> : current ? <div className="announcement-content">{urlifyText(current.content)}</div> : !error && "No announcements."}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={newer} disabled={loading || index === 0}>Newer</Button>
        <Button variant="text" onClick={older} disabled={loading || !current || (index + 1 >= announcements.length && !hasMore)}>Older</Button>
        <Button onClick={closeDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
}
