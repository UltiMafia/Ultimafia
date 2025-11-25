import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Typography,
  Grid2,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  // TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { TextEditor } from "../../components/Form";
import CustomMarkdown from "../../components/CustomMarkdown";

export default function Contributors(props) {
  const theme = useTheme();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editingContributor, setEditingContributor] = useState(null);
  const [editBio, setEditBio] = useState("");

  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Contributors | UltiMafia";

    axios
      .get("/api/site/contributors")
      .then((res) => {
        // Ensure we always have an array
        const data = Array.isArray(res.data) ? res.data : [];
        setContributors(data);
        setLoaded(true);
      })
      .catch((e) => {
        setContributors([]);
        setLoaded(true);
        errorAlert(e);
      });
  }, []);

  if (!loaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      ></Box>
    );
  }

  const typeLabels = {
    code: "Code",
    art: "Art",
    music: "Music & Sound",
    design: "Design",
  };

  const typeColors = {
    code: "primary",
    art: "primary",
    music: "primary",
    design: "primary",
  };

  const isOwnCard = (contributorId) => {
    return user.loaded && user.loggedIn && user.id === contributorId;
  };

  const handleCardClick = (contributor) => {
    if (isOwnCard(contributor.id)) {
      setEditingContributor(contributor.id);
      setEditBio(contributor.bio || "");
    }
  };

  const handleSaveBio = (contributorId) => {
    if (editBio.length > 240) {
      siteInfo.showAlert("Bio must be 240 characters or less.", "error");
      return;
    }

    axios
      .post("/api/user/contributorBio", { bio: editBio })
      .then(() => {
        // Update the contributor in the list
        setContributors((prev) =>
          prev.map((c) =>
            c.id === contributorId ? { ...c, bio: editBio } : c
          )
        );
        setEditingContributor(null);
        setEditBio("");
        siteInfo.showAlert("Bio updated.", "success");
      })
      .catch((e) => {
        errorAlert(e);
      });
  };

  const handleCancelEdit = () => {
    setEditingContributor(null);
    setEditBio("");
  };

  const contributorCards = contributors.map((contributor) => {
    const isOwn = isOwnCard(contributor.id);
    const isEditing = editingContributor === contributor.id;

    return (
      <Grid2
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
        key={contributor.id}
      >
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            width: "100%",
            position: "relative",
            cursor: isOwn ? "pointer" : "default",
            "&:hover": isOwn
              ? {
                  boxShadow: 2,
                }
              : {},
          }}
          onClick={() => handleCardClick(contributor)}
        >
          {isOwn && !isEditing && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 1,
              }}
            >
              <i className="fas fa-pencil-alt" style={{ fontSize: "16px", opacity: 0.7 }} />
            </Box>
          )}
          <CardContent>
            <Stack
              direction="column"
              spacing={2}
              alignItems="center"
              sx={{ height: "100%" }}
            >
              <Stack
                direction="column"
                spacing={1}
                alignItems="center"
                sx={{ width: "100%" }}
              >
                <Box display="flex" justifyContent="center" alignItems="center">
                  <Avatar
                    large
                    hasImage={contributor.avatar}
                    id={contributor.id}
                    name={contributor.name}
                  />
                </Box>
                <Typography
                  component="a"
                  href={
                    contributor.vanityUrl
                      ? `/user/${contributor.vanityUrl}`
                      : `/user/${contributor.id}`
                  }
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    textAlign: "center",
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {contributor.name}
                </Typography>
              </Stack>
              <Box
                display="flex"
                flexWrap="wrap"
                gap={0.5}
                justifyContent="center"
              >
                {contributor.types?.map((type) => (
                  <Chip
                    key={type}
                    label={typeLabels[type] || type}
                    color={typeColors[type] || "default"}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
              {isEditing ? (
                <Stack spacing={1} sx={{ width: "100%" }}>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <TextEditor value={editBio} onChange={setEditBio} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ textAlign: "right", opacity: 0.7 }}
                  >
                    {editBio.length}/240
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveBio(contributor.id);
                      }}
                      disabled={editBio.length > 240}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                contributor.bio && (
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "justify",
                      width: "100%",
                      px: 1,
                    }}
                  >
                    <CustomMarkdown>{contributor.bio}</CustomMarkdown>
                  </Typography>
                )
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid2>
    );
  });

  return (
    <>
      <Box mb={4}>
        <Typography variant="h2" gutterBottom>
          Contributors
        </Typography>
      </Box>
      <Grid2 container spacing={1}>
        {contributorCards}
      </Grid2>
    </>
  );
}
