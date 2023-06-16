import React from "react";
import { Link } from "react-router-dom";

import "../css/landing.css";

export default function LandingPage(props) {
  return (
    <div className="span-panel main landing-page">
      <div className="banner">
        <div className="characters-circle" />
      </div>
      <div className="play-break">
        <div className="play-btn-wrapper">
          <Link to="/auth/signup">Play Mafia</Link>
        </div>
      </div>
      <div className="intro">
        Ultimafia is the mafia site that is revolutionary in design, safety,
        and has a thriving community of users from all walks of life. With
        competitive and casual live mafia, and other gamemodes like Resistance,
        you're sure to find something that suits how YOU want to play.
      </div>
      <div className="mafia-features">
        <div className="chat-mafia">
          <div className="village-character" />
          <div className="feature-title">Chat Mafia</div>
          <div className="feature-desc">
            10-20 minute games with a variety of roles! Play with classic roles,
            or try out something different in the Sandbox lobby. You can create
            your own custom roles, too, using modifiers or by contributing to
            the codebase!
          </div>
        </div>
        <div className="forum-mafia">
          <div className="cop-character" />
          <div className="feature-title">Forum Mafia</div>
          <div className="feature-desc">
            Play Mafia in the forums. More features are coming soon with the
            planned forum game engine!
          </div>
        </div>
      </div>
      <div className="other-games">
        <div className="other-games-img" />
        <div className="feature-title">Other Games</div>
        <div className="feature-desc">
          Explore other Mafia-esque games like Ghost, Resistance, One Night Ultimate
          Werewolf, and 2 Rooms and a Boom.
        </div>
      </div>
    </div>
  );
}
