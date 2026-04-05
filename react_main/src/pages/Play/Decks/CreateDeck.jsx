import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SiteInfoContext } from "../../../Contexts";
import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
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

  if (params.get("edit") && !editing) {
    setEditing(true);
    axios
      .get(`/api/deck/${params.get("edit")}`)
      .then((res) => {
        let deck = res.data;
        setDeckName(deck.name);
        setCoverPhoto(deck.coverPhoto || "");
        getDeckProfiles(deck.profiles, deck.id);
      })
      .catch(errorAlert);
  }

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
      .catch(errorAlert);
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
    <div className="deck">
      <div className="main-section">
        <div className="span-panel deck-editor">
          <form
            onSubmit={handleSubmit((data) => {
              onCreateDeck(editing, data);
            })}
          >
            <div className="deck-cover-section">
              <span className="deck-field-label">Cover Photo</span>
              <div
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
                <input
                  ref={coverInputRef}
                  className="hidden-upload"
                  type="file"
                  accept="image/*"
                  onChange={onCoverSelect}
                />
              </div>
              {(coverPreview || coverPhoto) && (
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
                    <a
                      className="btn deck-buy-btn"
                      href="/user/shop?buy=anonymousDeck"
                    >
                      Buy More Decks
                    </a>
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
                        placeholder="Name"
                        maxLength={20}
                        {...register(`cards.${index}.name`)}
                        defaultValue={profile.name}
                      />
                      <input
                        className="color-input"
                        type="color"
                        {...register(`cards.${index}.color`)}
                        defaultValue={profile.color}
                      />
                      <a
                        className="btn deck-delete-btn"
                        onClick={() => removeProfile(index)}
                        title="Delete card"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </a>
                    </section>
                  );
                })}
              </div>
            )}
            <div className="deck-actions">
              <button
                type="submit"
                className="btn btn-success deck-submit-btn"
                title="Save deck"
              >
                <i className="fas fa-check-circle fa-lg"></i>
              </button>
              {editing && fields.length < 50 && (
                <a
                  className="btn deck-add-btn"
                  onClick={() =>
                    append({ name: `Profile ${fields.length + 1}` })
                  }
                  title="Add card"
                >
                  <i className="fas fa-plus"></i>
                </a>
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
