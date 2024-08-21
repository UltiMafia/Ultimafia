import React, { useState, useEffect } from "react";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";

import "../../css/contributors.css";

export default function Leaderboard(props) {
  const [competitivePlayers, setCompetitivePlayers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Leaderboard | UltiMafia";

    // Fetching the leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get("/site/leaderboard");
        const data = response.data;

        // Assuming competitivePoints is part of the response data
        const sortedPlayers = data.sort(
          (a, b) => (b.competitivePoints || 0) - (a.competitivePoints || 0)
        );
        setCompetitivePlayers(sortedPlayers);
        setLoaded(true);
      } catch (error) {
        setLoaded(true);
        errorAlert(error);
      }
    };

    // Fetch data once
    fetchLeaderboard();

    // Update every 1 minute
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!loaded) {
    return <p>Loading...</p>;
  }

  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      <p>
        Welcome to the UltiMafia leaderboard. Here you can see the top players
        ranked by their performance.
      </p>
      <h2>Round 1</h2>
      <p>
        The round will start on Tuesday, August 20 at 6:00 PM EST to Friday,
        August 30 at 6:00 PM EST.
      </p>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {competitivePlayers.map((player, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{player.name}</td>
              <td>{player.competitivePoints || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
