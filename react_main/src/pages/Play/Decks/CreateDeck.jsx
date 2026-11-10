import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import { SiteInfoContext } from "../../../Contexts";
import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
import UiAction from "../../../components/ui/UiAction";
import UiIcon from "../../../components/ui/UiIcon";
import { useErrorAlert } from "../../../components/Alerts";
import "css/deck.css";
import "css/form.css";

export default function CreateDecks() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
  } = useForm({
    defaultValues: {
      defProfile: [
        {
          name: "test",
          avatar: "",
          color: "",
          /*deathMessage: "",*/ id: "",
          deck: "",
          preview: "",
          image: "",
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    name: "cards",
    control,
  });

  const [deckName, setDeckName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [slots, setSlots] = useState({ owned: 0, purchased: 0 });
  const [coverPhoto, setCoverPhoto] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const coverInputRef = useRef(null);

  const setFile = (index) => (e) => {
    let newArr = [...selectedFiles]; // copying the old datas array
    newArr[index] = e.target.files; // replace e.target.value with whatever you want to change it to
    setSelectedFiles(newArr);
  };

  const editId = params.get("edit");
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setEditing(true);
    axios
      .get(`/api/deck/${editId}`)
      .then((res) => {
        if (cancelled) return;
        let deck = res.data;
        setDeckName(deck.name);
        setCoverPhoto(deck.coverPhoto || "");
        getDeckProfiles(deck.profiles, deck.id);
      })
      .catch(error => { if (!cancelled) { setLoadError(true); errorAlert(error); } });
    return () => { cancelled = true; };
  }, [editId]);
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  function onCoverSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function onCoverRemove() {
    setCoverFile(null);
    setCoverPreview("");
    if (!editing || !params.get("edit")) {
      setCoverPhoto("");
      return;
    }
    const formData = new FormData();
    formData.append("deckId", params.get("edit"));
    axios
      .post("/api/deck/coverPhoto", formData, {
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
      .post("/api/deck/coverPhoto", formData, {
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

  function removeProfile(index) {
    remove(index);
    let newArr = [...selectedFiles];
    newArr.splice(index, 1);
    setSelectedFiles(newArr);
  }

  function getDeckProfiles(profiles, deckId) {
    for (let i = 0; i < profiles.length; i++) {
      profiles[i].image = profiles[i].avatar;
      profiles[i].deckId = deckId;
    }
    setValue("cards", profiles, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function onCreateDeck(editing, data) {
    if (saving || loadError) return;
    if (!deckName.trim()) { errorAlert("Deck name is required."); return; }
    setSaving(true);
    let profiles = data.cards;
    axios
      .post("/api/deck/create", {
        name: deckName,
        profiles: profiles,
        editing: editing,
        id: params.get("edit"),
      })
      .then((res) => {
        siteInfo.showAlert(
          `${editing ? "Edited" : "Created"} deck '${deckName}'`,
          "success"
        );
        if (editing) {
          let profiles = data.cards;
          for (let i = 0; i < fields.length; i++) {
            if (selectedFiles[i]) {
              profiles[i].image = selectedFiles[i];
            }
          }
          onFileUpload(profiles);
          uploadCoverPhoto(params.get("edit"));
        } else {
          navigate({ search: `?edit=${res.data.id}` });
          setEditing(true);
          uploadCoverPhoto(res.data.id);
          axios
            .get("/api/deck/slots/info")
            .then((res) => setSlots(res.data))
            .catch(() => {});
        }
      })
      .catch(errorAlert)
      .finally(() => setSaving(false));
  }

  function onFileUpload(profiles) {
    if (profiles.length) {
      let formData = {};
      for (let i = 0; i < profiles.length; i++) {
        formData[`${i}`] = {
          name: profiles[i].name,
          color: profiles[i].color,
          // deathMessage: profiles[i].deathMessage,
          deckId: profiles[i].deckId,
          avatar: profiles[i].image ? profiles[i].image[0] : null,
          id: profiles[i].id,
        };
      }

      axios
        .post(`/api/deck/profiles/create`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {
          siteInfo.clearCache();
        })
        .catch((e) => {
          if (e.response == null || e.response.status == 413)
            errorAlert("File too large, must be less than 1 MB.");
          else errorAlert(e);
        });
    }
  }

  useEffect(() => {
    document.title = "Create Anonymous Deck | UltiMafia";
  }, []);

  useEffect(() => {
    axios
      .get("/api/deck/slots/info")
      .then((res) => setSlots(res.data))
      .catch(() => {});
  }, []);

  const atLimit = slots.owned >= slots.purchased;

  return (
    <div className="deck deck-editor-page">
      <header className="page-heading deck-editor-heading"><h1>{editId ? "Edit character deck" : "Create character deck"}</h1><Link to="/play/decks">Back to decks</Link></header>
      {loadError && <p role="alert">Could not load this deck. Return to the deck list and try again.</p>}
      <div className="main-section">
        <div className="span-panel deck-editor">
          <form
            onSubmit={handleSubmit((data) => {
              onCreateDeck(editing, data);
            })}
          >
            <div className="deck-cover-section">
              <span className="deck-field-label">Cover Photo</span>
              <button type="button" aria-label="Upload cover photo"
                className={`deck-cover-upload ${
                  coverPreview || coverPhoto ? "" : "empty"
                }`}
                onClick={() =>
                  coverInputRef.current && coverInputRef.current.click()
                }
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
              </button>
                <input
                  ref={coverInputRef}
                  className="hidden-upload"
                  type="file"
                  accept="image/*"
                  onChange={onCoverSelect}
                />
              {(coverPreview || coverPhoto) && (
                <UiAction variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCoverRemove();
                  }}
                >
                  Remove cover
                </UiAction>
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
                  maxLength={25}
                />
              </div>
              {!params.get("edit") && (
                <div className="deck-slots-info">
                  <div className="deck-slots-label">
                    Decks created:{" "}
                    <span className="deck-slots-count">
                      {slots.owned}/{slots.purchased}
                    </span>
                  </div>
                  {atLimit && (
                    <Link
                      className="btn deck-buy-btn"
                      to="/user/shop?buy=anonymousDeck"
                    >
                      Buy More Decks
                    </Link>
                  )}
                </div>
              )}
            </div>
            {editing && fields.length > 0 && (
              <div className="deck-grid">
                <div className="deck-grid-header">
                  <span>Card</span>
                  <span>Image</span>
                  <span>Name</span>
                  <span>Color</span>
                  <span className="deck-grid-header-delete">Delete</span>
                </div>
                {fields.map((profile, index) => {
                  return (
                    <section key={profile.id} className="deck-grid-row">
                      <div className="deck-row-index">#{index + 1}</div>
                      <ImageUpload
                        indx={index}
                        reg={register}
                        setFile={setFile}
                        watch={watch}
                        getValues={getValues}
                        selectedFile={selectedFiles[index]}
                      />
                      <input
                        className="deck-input"
                        aria-label={`Card ${index + 1} name`}
                        placeholder="Name"
                        maxLength={20}
                        {...register(`cards.${index}.name`)}
                        defaultValue={profile.name}
                      />
                      <input
                        className="color-input"
                        aria-label={`Card ${index + 1} color`}
                        type="color"
                        {...register(`cards.${index}.color`)}
                        defaultValue={profile.color}
                      />
                      <UiAction iconOnly variant="danger-quiet"
                        onClick={() => removeProfile(index)}
                        title="Delete card" aria-label={`Delete card ${index + 1}`}
                      >
                        <UiIcon name="delete" size={18} />
                      </UiAction>
                    </section>
                  );
                })}
              </div>
            )}
            <div className="deck-actions">
               <UiAction variant="primary"
                 busy={saving} disabled={loadError}
                type="submit"
                title="Save deck"
              >
                {editing ? "Save deck" : "Create deck"}
              </UiAction>
              {editing && fields.length < 50 && (
                <UiAction
                  onClick={() =>
                    append({ name: `Profile ${fields.length + 1}` })
                  }
                  title="Add card"
                >
                  <UiIcon name="add" size={18} /> Add card
                </UiAction>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export const ImageUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const inputRef = useRef();
  const setFile = props.setFile;
  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    let objectUrl = null;
    if (!selectedFile) {
      if (props.selectedFile == null) {
        setPreview(undefined);
        return;
      } else {
        setSelectedFile(props.selectedFile[0]);
        objectUrl = URL.createObjectURL(props.selectedFile[0]);
      }
    } else {
      objectUrl = URL.createObjectURL(selectedFile);
    }

    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onSelectFile = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }

    setSelectedFile(e.target.files[0]);
    setFile(props.indx)(e);
  };

  function onClick() {
    inputRef.current.click();
  }

  let style;

  if (selectedFile) {
    style = {
      backgroundImage: `url(${preview})`,
    };
  } else {
    style = {
      backgroundImage: `url(/uploads${props.getValues(
        `cards.${props.indx}.avatar`
      )}?t=${siteInfo.cacheVal})`,
    };
  }

  return (
    <div className="upload">
      <div className="avatar" style={style} onClick={onClick}>
        <div className="edit">
          <i className="far fa-file-image" />
          <input
            id={`preview-${props.indx}`}
            {...props.reg(`cards.${props.indx}.image`)}
            className="hidden-upload"
            type="file"
            ref={inputRef}
            onChange={onSelectFile}
          />
          {selectedFile && false && (
            <img
              className="card-preview"
              {...props.reg(`cards.${props.indx}`.preview)}
              src={preview}
            />
          )}
          {!selectedFile && false && (
            <img
              className="card-preview"
              {...props.reg(`cards.${props.indx}`.preview)}
              style={{
                backgroundImage: `url(/uploads${props.getValues(
                  `cards.${props.indx}.avatar`
                )}?t=${siteInfo.cacheVal})`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
