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
  Link,
} from "@mui/material";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { TextEditor } from "../../components/Form";
import CustomMarkdown from "../../components/CustomMarkdown";

export default function Donors(props) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const [donors, setDonors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [editBio, setEditBio] = useState("");

  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Donors | UltiMafia";

    axios
      .get("/api/site/donors")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setDonors(data);
        setLoaded(true);
      })
      .catch((e) => {
        setDonors([]);
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

  const isOwnCard = (donorId) => {
    return user.loaded && user.loggedIn && user.id === donorId;
  };

  const handleCardClick = (donor) => {
    if (isOwnCard(donor.id)) {
      setEditingDonor(donor.id);
      setEditBio(donor.bio || "");
    }
  };

  const handleSaveBio = (donorId) => {
    if (editBio.length > 240) {
      siteInfo.showAlert("Blurb must be 240 characters or less.", "error");
      return;
    }

    axios
      .post("/api/user/donorBio", { bio: editBio })
      .then(() => {
        setDonors((prev) =>
          prev.map((d) => (d.id === donorId ? { ...d, bio: editBio } : d))
        );
        setEditingDonor(null);
        setEditBio("");
        siteInfo.showAlert("Donor blurb updated.", "success");
      })
      .catch((e) => {
        errorAlert(e);
      });
  };

  const handleCancelEdit = () => {
    setEditingDonor(null);
    setEditBio("");
  };

  const donorCards = donors.map((donor) => {
    const isOwn = isOwnCard(donor.id);
    const isEditing = editingDonor === donor.id;

    return (
      <Grid2
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
        key={donor.id}
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
          onClick={() => handleCardClick(donor)}
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
              <i
                className="fas fa-pencil-alt"
                style={{ fontSize: "16px", opacity: 0.7 }}
              />
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
                    hasImage={donor.avatar}
                    id={donor.id}
                    name={donor.name}
                  />
                </Box>
                <Typography
                  component="a"
                  href={
                    donor.vanityUrl
                      ? `/user/${donor.vanityUrl}`
                      : `/user/${donor.id}`
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
                  {donor.name}
                </Typography>
              </Stack>
              <Box
                display="flex"
                flexWrap="wrap"
                gap={0.5}
                justifyContent="center"
              >
                <Chip
                  label="Donor"
                  color="primary"
                  size="small"
                  variant="outlined"
                />
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
                        handleSaveBio(donor.id);
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
                donor.bio && (
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "justify",
                      width: "100%",
                      px: 1,
                    }}
                  >
                    <CustomMarkdown>{donor.bio}</CustomMarkdown>
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
          Donors
        </Typography>
        <Typography variant="body1" paragraph>
          This page exists to thank the many people who have financially
          supported UltiMafia at their own expense. If you have donated to
          UltiMafia and are not listed here, please contact an admin
          immediately!
        </Typography>
        <Typography variant="body1" paragraph>
          This website is not for profit and is hosted primarily through
          donations from users. If you are able to, please consider donating on
          our{" "}
          <Link
            href="https://ko-fi.com/ultimafia"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ko-Fi
          </Link>{" "}
          in exchange for a special Donor profile badge and a spot on this page.
        </Typography>
      </Box>
      <Grid2 container spacing={1}>
        {donorCards}
      </Grid2>
    </>
  );
}
