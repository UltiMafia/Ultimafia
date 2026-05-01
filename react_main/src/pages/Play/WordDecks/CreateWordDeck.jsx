import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { SiteInfoContext } from "../../../Contexts";
import { useErrorAlert } from "../../../components/Alerts";
import "css/deck.css";
import "css/form.css";

const MAX_NAME_LENGTH = 25;
const MAX_DESCRIPTION_LENGTH = 120;
const MAX_WORD_DECK_SIZE = 500;
const MIN_WORD_DECK_SIZE = 20;
const MAX_WORD_LENGTH = 30;
const WORD_PATTERN = /^[a-z][a-z-]{1,29}$/;

export default function CreateWordDeck() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const editId = params.get("edit");

  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [wordsText, setWordsText] = useState("");
  const [editing, setEditing] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [loaded, setLoaded] = useState(!editId);
  const [slots, setSlots] = useState({ owned: 0, purchased: 0 });
  const [coverPhoto, setCoverPhoto] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const coverInputRef = useRef(null);

  useEffect(() => {
    document.title = "Create Word Deck | UltiMafia";
  }, []);

  useEffect(() => {
    axios
      .get("/api/wordDeck/slots/info")
      .then((res) => setSlots(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setEditing(true);
    axios
      .get(`/api/wordDeck/${editId}`)
      .then((res) => {
        const deck = res.data;
        setDeckName(deck.name || "");
        setDeckDescription(deck.description || "");
        setCoverPhoto(deck.coverPhoto || "");
        setIsDefault(!!deck.isDefault);
        const words = Array.isArray(deck.words) ? deck.words : [];
        setWordsText(words.join("\n"));
        setLoaded(true);
      })
      .catch((err) => {
        errorAlert(err);
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Parse + validate the words textarea
  const parsed = useMemo(() => {
    const rawLines = wordsText.split(/\r?\n/);
    const cleaned = [];
    const errors = [];

    rawLines.forEach((raw, idx) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      const lineNum = idx + 1;

      if (lower.length > MAX_WORD_LENGTH) {
        errors.push({
          line: lineNum,
          word: trimmed,
          reason: `too long (max ${MAX_WORD_LENGTH} chars)`,
        });
        return;
      }

      if (!WORD_PATTERN.test(lower)) {
        let reason = "invalid characters";
        if (/\s/.test(trimmed)) reason = "no spaces allowed";
        else if (!/^[a-z]/.test(lower)) reason = "must start with a letter";
        else if (/[^a-z-]/.test(lower)) reason = "letters and hyphens only";
        errors.push({ line: lineNum, word: trimmed, reason });
        return;
      }

      cleaned.push(lower);
    });

    return { cleaned, errors };
  }, [wordsText]);

  const wordCount = parsed.cleaned.length;
  const tooFew = wordCount < MIN_WORD_DECK_SIZE;
  const tooMany = wordCount > MAX_WORD_DECK_SIZE;
  const hasErrors = parsed.errors.length > 0;
  const atLimit = slots.owned >= slots.purchased;
  const showSlotWarning = !editId && atLimit;

  function onCoverSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function onCoverRemove() {
    setCoverFile(null);
    setCoverPreview("");
    if (!editing || !editId) {
      setCoverPhoto("");
      return;
    }
    const formData = new FormData();
    formData.append("deckId", editId);
    axios
      .post("/api/wordDeck/coverPhoto", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        setCoverPhoto("");
        siteInfo.clearCache();
      })
      .catch(errorAlert);
  }

  function uploadCoverPhoto(deckId) {
    if (!coverFile || !deckId) return Promise.resolve();
    const formData = new FormData();
    formData.append("deckId", deckId);
    formData.append("coverPhoto", coverFile);
    return axios
      .post("/api/wordDeck/coverPhoto", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setCoverPhoto(res.data.coverPhoto || "");
        setCoverFile(null);
        siteInfo.clearCache();
      })
      .catch((e) => {
        if (e.response == null || e.response.status == 413)
          errorAlert("Cover photo too large, must be less than 2 MB.");
        else errorAlert(e);
      });
  }

  function onSubmit(e) {
    e.preventDefault();
    if (isDefault || submitting) return;

    if (!deckName.trim()) {
      errorAlert("Deck name is required.");
      return;
    }

    if (hasErrors) {
      errorAlert("Please fix the invalid words before saving.");
      return;
    }

    if (tooFew) {
      errorAlert(`A word deck needs at least ${MIN_WORD_DECK_SIZE} words.`);
      return;
    }

    if (tooMany) {
      errorAlert(`A word deck can have at most ${MAX_WORD_DECK_SIZE} words.`);
      return;
    }

    setSubmitting(true);

    axios
      .post("/api/wordDeck/create", {
        editing: editing,
        id: editId || undefined,
        name: deckName.trim(),
        description: deckDescription.trim(),
        words: parsed.cleaned,
      })
      .then(async (res) => {
        const newId = (res.data && res.data.id) || editId;
        await uploadCoverPhoto(newId);
        siteInfo.showAlert(
          `${editing ? "Edited" : "Created"} word deck '${deckName.trim()}'`,
          "success"
        );
        navigate("/play/wordDecks");
      })
      .catch((err) => {
        setSubmitting(false);
        errorAlert(err);
      });
  }

  const inputsDisabled = isDefault;

  return (
    <div className="deck">
      <div className="main-section">
        <div className="span-panel deck-editor">
          {isDefault && (
            <div
              className="deck-default-warning"
              style={{
                padding: "12px",
                marginBottom: "12px",
                background: "rgba(200, 60, 60, 0.15)",
                border: "1px solid rgba(200, 60, 60, 0.4)",
                borderRadius: 4,
              }}
            >
              This is a built-in deck and can't be edited.
            </div>
          )}

          {showSlotWarning && (
            <div
              className="deck-slot-warning"
              style={{
                padding: "12px",
                marginBottom: "12px",
                background: "rgba(200, 150, 60, 0.15)",
                border: "1px solid rgba(200, 150, 60, 0.4)",
                borderRadius: 4,
              }}
            >
              You need to purchase more word deck slots from the shop.{" "}
              <a href="/user/shop?buy=wordDeck">Visit the shop</a>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="deck-cover-section">
              <span className="deck-field-label">Cover Photo</span>
              <div
                className={`deck-cover-upload ${
                  coverPreview || coverPhoto ? "" : "empty"
                }`}
                onClick={() => {
                  if (inputsDisabled) return;
                  if (coverInputRef.current) coverInputRef.current.click();
                }}
                style={
                  coverPreview
                    ? { backgroundImage: `url(${coverPreview})` }
                    : coverPhoto
                    ? {
                        backgroundImage: `url(/uploads${coverPhoto}?t=${siteInfo.cacheVal})`,
                      }
                    : undefined
                }
              >
                {!coverPreview && !coverPhoto && (
                  <div className="deck-cover-placeholder">
                    <i className="far fa-image" />
                    <span>Click to upload</span>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  className="hidden-upload"
                  type="file"
                  accept="image/*"
                  onChange={onCoverSelect}
                  disabled={inputsDisabled}
                />
              </div>
              {(coverPreview || coverPhoto) && !inputsDisabled && (
                <a
                  className="btn deck-cover-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCoverRemove();
                  }}
                >
                  Remove cover
                </a>
              )}
            </div>

            <div className="deck-top-bar">
              <div className="deck-name-section">
                <label className="deck-field-label" htmlFor="deck-name-input">
                  Deck Name
                </label>
                <input
                  id="deck-name-input"
                  className="deck-input deck-name-input"
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Enter deck name"
                  maxLength={MAX_NAME_LENGTH}
                  disabled={inputsDisabled}
                />
                <label
                  className="deck-field-label"
                  htmlFor="deck-description-input"
                  style={{ marginTop: 12, display: "block" }}
                >
                  Description (optional)
                </label>
                <input
                  id="deck-description-input"
                  className="deck-input deck-name-input"
                  type="text"
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  placeholder="What's in this deck?"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  disabled={inputsDisabled}
                />
              </div>
              {!editId && (
                <div className="deck-slots-info">
                  <div className="deck-slots-label">
                    Decks created:{" "}
                    <span className="deck-slots-count">
                      {slots.owned}/{slots.purchased}
                    </span>
                  </div>
                  {atLimit && (
                    <a
                      className="btn deck-buy-btn"
                      href="/user/shop?buy=wordDeck"
                    >
                      Buy More Slots
                    </a>
                  )}
                </div>
              )}
            </div>

            <div
              className="deck-words-section"
              style={{ marginTop: 16, marginBottom: 16 }}
            >
              <label
                className="deck-field-label"
                htmlFor="deck-words-input"
                style={{ display: "block", marginBottom: 4 }}
              >
                Words (one per line)
              </label>
              <textarea
                id="deck-words-input"
                className="deck-input"
                rows={20}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  resize: "vertical",
                  minHeight: 320,
                }}
                value={wordsText}
                onChange={(e) => setWordsText(e.target.value)}
                placeholder={
                  "apple\nbanana\ncherry\n\nOne word per line. Lowercase letters and hyphens only."
                }
                disabled={inputsDisabled}
              />
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: tooFew || tooMany ? "#d04040" : undefined,
                    fontWeight: 600,
                  }}
                >
                  {wordCount} / {MAX_WORD_DECK_SIZE} words
                </span>
                {tooFew && (
                  <span style={{ color: "#d04040", fontSize: "0.85rem" }}>
                    Need at least {MIN_WORD_DECK_SIZE} words
                  </span>
                )}
                {tooMany && (
                  <span style={{ color: "#d04040", fontSize: "0.85rem" }}>
                    Too many words (max {MAX_WORD_DECK_SIZE})
                  </span>
                )}
              </div>

              {hasErrors && (
                <ul
                  className="deck-word-errors"
                  style={{
                    marginTop: 8,
                    color: "#d04040",
                    fontSize: "0.85rem",
                    paddingLeft: 18,
                    maxHeight: 160,
                    overflowY: "auto",
                  }}
                >
                  {parsed.errors.slice(0, 50).map((err, i) => (
                    <li key={i}>
                      ❌ Line {err.line}: '{err.word}' ({err.reason})
                    </li>
                  ))}
                  {parsed.errors.length > 50 && (
                    <li>...and {parsed.errors.length - 50} more</li>
                  )}
                </ul>
              )}
            </div>

            <div className="deck-actions">
              <button
                type="submit"
                className="btn btn-success deck-submit-btn"
                title="Save deck"
                disabled={
                  inputsDisabled ||
                  submitting ||
                  hasErrors ||
                  tooFew ||
                  tooMany ||
                  !deckName.trim() ||
                  (!editing && atLimit) ||
                  !loaded
                }
              >
                <i className="fas fa-check-circle fa-lg" />
                <span style={{ marginLeft: 6 }}>
                  {editing ? "Save Changes" : "Create Deck"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
