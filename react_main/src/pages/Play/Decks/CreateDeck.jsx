import React, { useContext, useEffect, useRef, useState } from "react";
import {
  useLocation,
  useHistory,
} from "react-router-dom/cjs/react-router-dom.min";
import { SiteInfoContext } from "../../../Contexts";
import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
import { useErrorAlert } from "../../../components/Alerts";
import "../../../css/deck.css";
import "../../../css/form.css";

export default function CreateDecks() {
  const location = useLocation();
  const history = useHistory();
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

  const setFile = (index) => (e) => {
    let newArr = [...selectedFiles]; // copying the old datas array
    newArr[index] = e.target.files; // replace e.target.value with whatever you want to change it to
    setSelectedFiles(newArr);
  };

  if (params.get("edit") && !editing) {
    setEditing(true);
    axios
      .get(`/deck/${params.get("edit")}`)
      .then((res) => {
        let deck = res.data;
        setDeckName(deck.name);
        getDeckProfiles(deck.profiles, deck.id);
      })
      .catch(errorAlert);
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
    .post("/deck/create", {
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
      }
      else {
        history.push({ search: `?edit=${res.data.id}` });
        setEditing(true);
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
        .post(`/deck/profiles/create`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {
          siteInfo.clearCache();
        })
        .catch((e) => {
          if (e.response == null || e.response.status == 413)
            errorAlert("File too large, must be less than 2 MB.");
          else errorAlert(e);
        });
    }
  }

  useEffect(() => {
    document.title = "Create Anonymous Deck | UltiMafia";
  }, []);

  return (
    <div className="deck">
      <div className="main-section">
        <div className="span-panel">
          <form
            onSubmit={handleSubmit((data) => {
              onCreateDeck(editing, data);
              siteInfo.clearCache();
            })}
          >
            <h3>Deck Name</h3>
            <input
              className="deck-input"
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
            {editing && (
              <>
                {fields.map((profile, index) => {
                  return (
                    <div className="inputs">
                      <>
                        <h4>Card #{index + 1}</h4>
                        <section key={profile.id}>
                          <ImageUpload
                            indx={index}
                            reg={register}
                            setFile={setFile}
                            watch={watch}
                            getValues={getValues}
                            selectedFile={selectedFiles[index]}
                          ></ImageUpload>
                          <label>
                            <span>Name</span>
                            <input
                              {...register(`cards.${index}.name`)}
                              defaultValue={profile.name}
                            />
                          </label>
                          <label>
                            <span>Color</span>
                            <input
                              className="color-input"
                              type="color"
                              {...register(`cards.${index}.color`)}
                              defaultValue={profile.color}
                            />
                          </label>
                          {/* <label>
                    <span>Death Message</span>
                    <input
                      type="text"
                      {...register(`cards.${index}.deathMessage`)}
                      defaultValue={profile.deathMessage}
                    />
                  </label> */}
                          <label>
                            <span>Delete?</span>
                            <a
                              className="btn"
                              onClick={() => removeProfile(index)}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </a>
                          </label>
                        </section>
                      </>
                    </div>
                  );
                })}
              </>
            )}
            {editing && fields.length < 50 && (
              <a
                className="btn"
                onClick={() => append({ name: `Name${fields.length + 1}` })}
              >
                <i className="fas fa-plus"></i>
              </a>
            )}
            <button type="submit" className="btn btn-success">
              <i className="fas fa-check-circle fa-lg"></i>
            </button>
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
      if(props.selectedFile == null) {
        setPreview(undefined);
        return;
      }
      else{
        setSelectedFile(props.selectedFile[0]);
        objectUrl = URL.createObjectURL(props.selectedFile[0]);
      }
    }
    else {
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
