import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { Button } from "@mui/material";
import LobbySidebarPanel from "./LobbySidebarPanel";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { UserContext } from "Contexts";
import { Link } from "react-router-dom";

export const FeaturedSetup = ({ lobby }) => {
  const user = useContext(UserContext);
  const [featuredSetup, setFeaturedSetup] = useState(null);
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);
  const isMountedRef = useRef(true);


  // Fetch the featured setup for this lobby
  useEffect(() => {
    isMountedRef.current = true;
    var featuredCategory = "main";

    if (lobby === "Games") {
      featuredCategory = "minigames";
    }

    axios
      .get(`/api/setup/featuredSetup?featuredCategory=${featuredCategory}`)
      .then((res) => {
        if (isMountedRef.current) {
          setFeaturedSetup(res.data);
        }
      });

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [lobby]);

  if (!featuredSetup) {
    return "";
  }

  return (
    <>
      <HostGameDialogue
        open={ishostGameDialogueOpen}
        setOpen={setIshostGameDialogueOpen}
        setup={featuredSetup}
      />
      <LobbySidebarPanel title="Featured setup" className="featured-setup">
        <Setup setup={featuredSetup} summary />
        <div className="featured-setup-action">
          {user.loggedIn ?
          <Button
            color="primary"
            variant="outlined"
            onClick={() => setIshostGameDialogueOpen(true)}
          >
            Host this setup
          </Button> : <Button component={Link} to="/welcome" variant="outlined">Sign in to host</Button>}
        </div>
      </LobbySidebarPanel>
    </>
  );
};
