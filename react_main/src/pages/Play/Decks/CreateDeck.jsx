import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { SiteInfoContext, UserContext } from "../../../Contexts";
// import Form, { useForm } from "../../../components/Form";
import { useFieldArray, useForm } from 'react-hook-form';
import axios from "axios";
import { useErrorAlert } from "../../../components/Alerts";
import LoadingPage from "../../Loading";
import { render } from "ejs";
import { HiddenUpload } from "../../../components/Form";
import "../../../css/deck.css";
import "../../../css/form.css";


let renderCount = 0;

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
    control
  } = useForm({
    defaultValues: {
      cart: [{ name: "test", avatar: "", color: "", deathMessage: "", id: "", deck: "", preview: "", image: "" }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    name: "fart",
    control
  });
  renderCount++;

  const [deckName, setDeckName] = useState("");
  const [editing, setEditing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const setFile = index => e => {
    console.log(`index: ${index}`);
    console.log(`e.target.files: ${e.target.files}`);
    let newArr = [...selectedFiles]; // copying the old datas array
    newArr[index] = e.target.files; // replace e.target.value with whatever you want to change it to
    setSelectedFiles(newArr);
  }

  if(params.get("edit") && !editing) {
    setEditing(true);
    axios
      .get(`/deck/${params.get("edit")}`)
      .then((res) => {
        let deck = res.data;
        setDeckName(deck.name);
        getDeckProfiles(deck.profiles);
      })
      .catch(errorAlert);
  }

  function removeProfile (index) {
    remove(index);
    // axios
    //   .post(`/deck/deleteProfile/${fields[index]._id}`)
    //   .then((res) => {
    //     siteInfo.showAlert("Profile deleted", "success");
    //     siteInfo.clearCache();
    //   })
    //   .catch(errorAlert);
  }
  
  function getDeckProfiles(profleIds) {
    axios
      .get(`/deck/profiles/${params.get("edit")}`, { params: { ids: profleIds } })
      .then((res) => {
        let profiles = res.data;
        for (let i = 0; i < profiles.length; i++) {
          profiles[i].image = profiles[i].avatar;
        }
        setValue("fart", profiles, { shouldValidate: true, shouldDirty: true });
      })
      .catch(errorAlert);
  }

  function onCreateDeck(editing, data) {
    let profiles = data.fart;

    if (!editing) {
      axios
        .post("/deck/create", {
          name: deckName,
          profiles: profiles,
          editing: editing,
          id: params.get("edit"),
        })
        .then((res) => {
          siteInfo.showAlert(
            `${editing ? "Edited" : "Created"} deck '${deckName}'`, "success");
          !editing ? setEditing(true) : setEditing(false);
          history.push({ search: `?edit=${res.data}` });
          for (let i = 0; i < 5; i++) {
            append({ name: ""});
          }
        })
        .catch(errorAlert);
    }
    else {
      axios
        .post("/deck/edit", {
          name: deckName,
          profiles: profiles,
          id: params.get("edit"),
        })
        .then((res) => {
          let profiles = data.fart;
          for (let i = 0; i < fields.length; i++) {
            // profiles[i].image = watch(`fart.${i}.image`, 'image');
            if (selectedFiles[i]) {
              profiles[i].image = selectedFiles[i];
            }
            profiles[i].deckId = res.data.id;
          }
          onFileUpload(profiles);
          siteInfo.showAlert(
            `${editing ? "Edited" : "Created"} deck '${deckName}'`,
            "success"
          );
          
        })
        .catch(errorAlert);
    }
  }

  function onFileUpload(profiles) {
    if (profiles.length) {
      let formData = {};
      for (let i = 0; i < profiles.length; i++) {
        formData[`${i}`] = {
          name: profiles[i].name,
          color: profiles[i].color,
          deathMessage: profiles[i].deathMessage,
          deckId: profiles[i].deckId,
          avatar: profiles[i].image[0],
          id: profiles[i].id,
        };
      }

      axios
        .post(`/deck/profiles/create`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
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

  return (
    <div className="deck">
      <div className="main-section">
        <div className="span-panel">
          <form onSubmit={handleSubmit((data) =>{
            console.log("Submit data", data);
            onCreateDeck(editing, data);
            siteInfo.clearCache();
            })}>
            
            <h3>Deck Name</h3>
            <input className="deck-input" type="text" value={deckName} onChange={e => setDeckName(e.target.value)} />
            {editing && <>
            {fields.map((profile, index) => {
              return (
                <div className="inputs">
                <><h4>Card #{index+1}</h4>
                <section key={profile.id}>
                <ImageUpload kee={index} reg={register} setFile={setFile} watch={watch} getValues={getValues}></ImageUpload>
                  <label>
                    <span>Name</span>
                    <input
                      {...register(`fart.${index}.name`)}
                      defaultValue={profile.name}
                    />
                  </label>
                  <label>
                    <span>Color</span>
                    <input className="color-input"
                      type="color"
                      {...register(`fart.${index}.color`)}
                      defaultValue={profile.color}
                    />
                  </label>
                  <label>
                    <span>Death Message</span>
                    <input
                      type="text"
                      {...register(`fart.${index}.deathMessage`)}
                      defaultValue={profile.deathMessage}
                    />
                  </label>
                  <label>
                    <span>Delete?</span>
                    <a class="btn" href="#" onClick={() => removeProfile(index)}>
                      <i class="fas fa-trash-alt"></i>
                    </a>
                  </label>
                </section></>
                </div>
              );
            })}</>}
            { editing && <a class="btn" href="#" onClick={() => append({ name: "append" })}>
              <i class="fas fa-plus"></i>
            </a>}
            {/* {editing && <button type="button" onClick={() => append({ name: "append" })}>
              Append
            </button>} */}
            <button type="submit" class="btn btn-success"><i class="fas fa-check-circle fa-lg"></i></button>
            </form>
            </div>
          </div>
        </div>);
        {/* {fields.map((field, index) => {
          return (
            <><h4>Card #{index+1}</h4>
            <section key={field.id}>
            <ImageUpload kee={index} reg={register}></ImageUpload>
              <label>
                <span>Name</span>
                <input
                  {...register(`cart.${index}.name`)}
                />
              </label>
              <label>
                <span>Color</span>
                <input
                  type="color"
                  {...register(`cart.${index}.color`)}
                />
              </label>
              <label>
                <span>Death Message</span>
                <input
                  type="text"
                  {...register(`cart.${index}.deathMessage`)}
                />
              </label>
              <button type="button" onClick={() => remove(index)}>
                Delete
              </button>
            </section></>
          );
        })} */}
}

export const ImageUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const [previews, setPreviews] = useState([]);

  const inputRef = useRef();
  const setValue = props.setValue;
  const setFile = props.setFile;

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }


    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);


    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onSelectFile = e => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }


    setSelectedFile(e.target.files[0]);
    setFile(props.kee)(e);
    
  }

  function onClick() {
    inputRef.current.click();
  }

  let style;
  if (selectedFile) {
    style = {
      backgroundImage: `url(${preview})`,
    };
  }
  else {
    style = {
      backgroundImage: `url(/uploads${props.getValues(`fart.${props.kee}.avatar`)}?t=${siteInfo.cacheVal})`,
    };
  }

  return (
    <div className="upload">
      <div className="avatar" style={style} onClick={onClick}>
        <div className="edit">
          <i className="far fa-file-image" />
          <input
            id={`preview-${props.kee}`}
            {...props.reg(`fart.${props.kee}.image`)}
            className="hidden-upload"
            type="file"
            ref={inputRef}
            onChange={onSelectFile}
          />
          {selectedFile && false && <img className="card-preview" {...props.reg(`fart.${props.kee}`.preview)} src={preview} />}
          {!selectedFile && false && <img className="card-preview" {...props.reg(`fart.${props.kee}`.preview)} style={{backgroundImage: `url(/uploads${props.getValues(`fart.${props.kee}.avatar`)}?t=${siteInfo.cacheVal})`}} />}
          {/* <input type="file" id={`preview-${props.kee}`} {...props.reg(`fart.${props.kee}.image`)} onChange={onSelectFile} /> */}
          {/* {selectedFile && <img className="card-preview" {...props.reg(`fart.${props.kee}.preview`)} src={preview} />} */}
          {/* {!selectedFile && <img className="card-preview" {...props.reg(`fart.${props.kee}.preview`)} style={{backgroundImage: `url(/uploads${props.getValues(`fart.${props.kee}.avatar`)}?t=${siteInfo.cacheVal})`}} />} */}
        </div>
      </div>
    </div>
  );
}

const DeckAvatar = (props) => {
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onSelectFile = e => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }

    setSelectedFile(e.target.files[0]);
    
  }

  return (
    <div
      className={`avatar`}
      style={{backgroundImage: `url(/uploads${props.getValues(`fart.${props.kee}.avatar`)}?t=${siteInfo.cacheVal})`}}
    >
      {props.edit && (
        <HiddenUpload className="edit" name="avatar" onFileUpload={onSelectFile}>
          <i className="far fa-file-image" />
        </HiddenUpload>
      )}
    </div>
  );
}

// export default function CreateDecks() {
//   const user = useContext(UserContext);

//   // const [formFields, updateFormFields, resetFormFields] = useForm([
//   //   {
//   //     label: "Deck Name",
//   //     ref: "name",
//   //     type: "text",
//   //   },
//   //   {
//   //     label: "Deck Words (max 50), space-separated",
//   //     ref: "words",
//   //     type: "text",
//   //     textStyle: "large",
//   //     value: "word1 word2 word3 word4 word5",
//   //   },
//   // ]);

//   // function onCreateDeck(editing) {
//   //   let profiles = tempParseWordsToProfiles(formFields[1].value);

//   //   axios
//   //     .post("/deck/create", {
//   //       name: formFields[0].value,
//   //       profiles: profiles,
//   //       editing: editing,
//   //       id: params.get("edit"),
//   //     })
//   //     .then(() => {
//   //       siteInfo.showAlert(
//   //         `${editing ? "Edited" : "Created"} deck '${formFields[0].value}'`,
//   //         "success"
//   //       );
//   //     })
//   //     .catch(errorAlert);
//   // }

//   const errorAlert = useErrorAlert();
//   const [editing, setEditing] = useState(false);

//   const location = useLocation();
//   const params = new URLSearchParams(location.search);

//   const siteInfo = useContext(SiteInfoContext);

//   useEffect(() => {
//     document.title = "Create Anonymous Deck | UltiMafia";
//   }, []);

  // useEffect(() => {
  //   if (params.get("edit")) {
  //     axios
  //       .get(`/deck/${params.get("edit")}`)
  //       .then((res) => {
  //         var deck = res.data;

  //         setEditing(true);

  //         let words = tempParseProfilesToWords(JSON.parse(deck.profiles));
  //         deck.words = words;

  //         var formFieldChanges = [];

  //         for (let field of formFields) {
  //           if (deck[field.ref]) {
  //             let value = deck[field.ref];

  //             formFieldChanges.push({
  //               ref: field.ref,
  //               prop: "value",
  //               value: value,
  //             });
  //           }
  //         }

  //         updateFormFields(formFieldChanges);
  //       })
  //       .catch(errorAlert);
  //   }
  // }, []);

  // if (editing && !params.get("edit")) {
//   //   resetFormFields();
//   // }

//   // if (params.get("edit") && !editing) return <LoadingPage />;

//   // return (
//   //   <div className="span-panel main create-deck">
//   //     {user.loggedIn && (
//   //       <div className="creation-options">
//   //         <Form
//   //           fields={formFields}
//   //           onChange={updateFormFields}
//   //           submitText={editing ? "Edit" : "Create"}
//   //           onSubmit={() => onCreateDeck(editing)}
//   //         />
//   //       </div>
//   //     )}
//   //   </div>
//   // );
// }
