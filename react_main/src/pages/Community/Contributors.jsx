import React, { useState, useEffect } from "react";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";

import LoadingPage from "../Loading";
import { NameWithAvatar } from "../User/User";
import { RoleCount } from "../../components/Roles";

import "../../css/contributors.css";

export default function Contributors(props) {
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Contributors | UltiMafia";

    axios
      .get("/site/contributors")
      .then((res) => {
        setContributors(res.data);
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(true);
        errorAlert(e);
      });
  }, []);

  if (!loaded) return <LoadingPage />;

  const developers = contributors["dev"].map((user) => (
    <div className="developer member user-cell" key={user.id}>
      <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
    </div>
  ));

  const artists = contributors["art"].map((item) => {
    const user = item.user;
    const roles = item.roles;

    var roleIcons = [];
    for (let gameType in roles) {
      const rolesForGameType = roles[gameType];
      roleIcons.push(
        ...rolesForGameType.map((roleName) => (
          <RoleCount scheme="vivid" role={roleName} gameType={gameType} />
        ))
      );
    }

    return (
      <div className="artist-contribution member user-cell">
        <div className="artist-user">
          <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
        </div>
        <div className="artist-roles">{roleIcons}</div>
      </div>
    );
  });

  return (
    <>
      <div className="span-panel main contributors">
        <div className="contributors-meta">
          Thank you to everyone who helped built this site and community. This
          page recognises people who contributed to site development, but not to
          forget moderators, ex-moderators and community organisers who do a big
          part of the work building our community. If you are missed out, please
          DM us as soon as possible!
        </div>
        <div className="contributors-section">
          <h1 className="contributors-title">Developers</h1>
          <p className="contributors-description">
            Includes coders on
            <a href="https://github.com/UltiMafia/Ultimafia">Github</a> and the
            role patrol on our discord.
          </p>
          <div className="contributors-data dev">{developers}</div>
        </div>
        <div className="contributors-section">
          <h1 className="contributors-title">Artists</h1>
          <p className="contributors-description">
            Role icon artists. Work in progress!{" "}
          </p>
          <div className="contributors-data">{artists}</div>
        </div>
        <div className="contributors-section">
          <h1 className="contributors-title">Music</h1>
          <p className="contributors-description">
            Music is by Fred, check out his youtube{" "}
            <a href="https://www.youtube.com/@fredthemontymole">
              @fredthemontymole
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
