import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { SiteInfoContext } from "../../../Contexts";
import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
import { useErrorAlert } from "../../../components/Alerts";
import { Container, Paper, Typography, Button, IconButton, TextField, Input, Grid, Box } from "@mui/material";
import { useTheme } from "@mui/styles";
import "../../../css/deck.css";
import "../../../css/form.css";

export default function CreateDecks() {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

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
    let newArr = [...selectedFiles];
    newArr[index] = e.target.files;
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
        } else {
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
    <Container>
      <Paper elevation={3} className="deck" style={{ padding: theme.spacing(3) }}>
        <Typography variant="h4">Create Anonymous Deck</Typography>
        <form
          onSubmit={handleSubmit((data) => {
            onCreateDeck(editing, data);
          })}
        >
          <Typography variant="h6">Deck Name</Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />
          {editing && (
            <>
              {fields.map((profile, index) => (
                <Box key={profile.id} mt={2}>
                  <Typography variant="h6">Card #{index + 1}</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <ImageUpload
                        indx={index}
                        reg={register}
                        setFile={setFile}
                        watch={watch}
                        getValues={getValues}
                        selectedFile={selectedFiles[index]}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        variant="outlined"
                        {...register(`cards.${index}.name`)}
                        defaultValue={profile.name}
                      />
                      <TextField
                        fullWidth
                        label="Color"
                        variant="outlined"
                        type="color"
                        {...register(`cards.${index}.color`)}
                        defaultValue={profile.color}
                        margin="normal"
                      />
                      <Box display="flex" alignItems="center">
                        <Typography>Delete?</Typography>
                        <IconButton onClick={() => removeProfile(index)}>
                          <i className="fas fa-trash-alt"></i>
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </>
          )}
          {editing && fields.length < 50 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<i className="fas fa-plus"></i>}
              onClick={() => append({ name: `Profile ${fields.length + 1}` })}
              style={{ marginTop: theme.spacing(2) }}
            >
              Add Profile
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<i className="fas fa-check-circle"></i>}
            style={{ marginTop: theme.spacing(2) }}
          >
            {editing ? "Edit Deck" : "Create Deck"}
          </Button>
        </form>
      </Paper>
    </Container>
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

  const handleClick = () => {
    inputRef.current.click();
  };

  const style = selectedFile
    ? { backgroundImage: `url(${preview})` }
    : { backgroundImage: `url(/uploads${props.getValues(`cards.${props.indx}.avatar`)}?t=${siteInfo.cacheVal})` };

  return (
    <Box className="upload">
      <Box
        className="avatar"
        style={style}
        onClick={handleClick}
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={128}
        height={128}
        border={1}
        borderColor="grey.500"
        borderRadius="50%"
        overflow="hidden"
      >
        <Box className="edit">
          <i className="far fa-file-image" />
          <Input
            type="file"
            inputRef={inputRef}
            className="hidden-upload"
            {...props.reg(`cards.${props.indx}.image`)}
            onChange={onSelectFile}
          />
        </Box>
      </Box>
    </Box>
  );
};
