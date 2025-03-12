import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPlayers = async () => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/players`, {
        method: 'GET',
          redirect: 'follow',
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true' // Bypass ngrok warning
          }
      });
      const data = await response.json();
      setPlayers(data);
    };

    fetchPlayers();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredPlayers = Object.keys(players)
    .map((teamId) => {
      if (teamId !== "0") {
        const team = players[teamId];
        const filteredTeamPlayers = team.players.filter(
          (player) =>
            player.player_name.toLowerCase().includes(search.toLowerCase()) // filter logic
        );
        return { ...team, players: filteredTeamPlayers };
      }
      return null;
    })
    .filter((team) => team && team.players.length > 0);

  return (
    <div className="text-white">
      <div className="flex items-center justify-between m-4">
          <h1 className="text-4xl font-bold">All Players</h1>
          {/* Search Bar */}
          <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={handleSearch}
              className="px-4 py-2 w-full sm:w-1/3 bg-gray-200 text-black rounded-md"
          />
      </div>
      {filteredPlayers && filteredPlayers.length > 0 ? (
        <ul>
          {filteredPlayers.map((team) => (
            <li key={team.teamId}>
              <strong>{team.team_name}</strong>
              <div className="w-full px-4 grid md:grid-cols-4 gap-8 text-black">
                {team.players.map((player) => (
                  <div
                    className="w-full bg-[#EDFDFE] mx-auto shadow-xl flex flex-col p-4 my-4 rounded-lg hover:scale-105 duration-300"
                    key={player.player_id}
                  >
                    <h2 className="text-l font-bold text-left pt-2">
                      {player.player_name}
                    </h2>
                    <h3>
                      {player.position} - {player.team_} #{player.jersey_number}
                    </h3>
                    <Link
                      className="bg-[#00a8e8] w-[200px] rounded-md font-medium text-center mx-auto py-3 text-white"
                      to={`/nba/player/${player.player_id}`}
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No player data available</p>
      )}
    </div>
  );
};

export default Players;
