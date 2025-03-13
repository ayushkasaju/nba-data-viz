import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // View mode: "grid", "list", or "table"
  const [loading, setLoading] = useState(true); // Loading state
  const [sortBy, setSortBy] = useState("player_name"); // Sorting state for table view
  const [sortOrder, setSortOrder] = useState("asc"); // Sort order: asc/desc

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/players`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredPlayers = Object.keys(players)
    .map((teamId) => {
      if (teamId !== "0") {
        const team = players[teamId];
        const filteredTeamPlayers = team.players
          .filter((player) =>
            player.player_name.toLowerCase().includes(search.toLowerCase())
          )
          .sort((a, b) => {
            if (sortBy === "player_name") {
              return sortOrder === "asc"
                ? a.player_name.localeCompare(b.player_name)
                : b.player_name.localeCompare(a.player_name);
            } else if (sortBy === "position") {
              return sortOrder === "asc"
                ? a.position.localeCompare(b.position)
                : b.position.localeCompare(a.position);
            } else if (sortBy === "jersey_number") {
              return sortOrder === "asc"
                ? a.jersey_number - b.jersey_number
                : b.jersey_number - a.jersey_number;
            }
            return 0;
          });
        return { ...team, players: filteredTeamPlayers };
      }
      return null;
    })
    .filter((team) => team && team.players.length > 0);

  const renderGridView = (team) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {team.players.map((player) => (
        <div
          key={player.player_id}
          className="bg-gray-800/70 backdrop-blur-md rounded-xl p-5 border border-gray-700 
                    hover:border-blue-400 transition-all duration-300 group shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            {/* Placeholder for player image */}
            <div className="w-10 h-10 bg-gray-600 rounded-full" />
            <h3 className="text-lg font-semibold text-white">{player.player_name}</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            {player.position} | {team.team_name} #{player.jersey_number}
          </p>
          <Link
            to={`/nba/player/${player.player_id}`}
            className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                      text-white text-center py-2 rounded-lg transition-all duration-300 group-hover:scale-105"
          >
            View Profile
          </Link>
        </div>
      ))}
    </div>
  );

  const renderListView = (team) => (
    <div className="space-y-4">
      {team.players.map((player) => (
        <div
          key={player.player_id}
          className="flex flex-col sm:flex-row items-center bg-gray-800/70 backdrop-blur-md rounded-xl p-5 
                    border border-gray-700 hover:border-blue-400 transition-all duration-300 group shadow-md"
        >
          <div className="flex items-center gap-3 flex-1 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-gray-600 rounded-full" />
            <div>
              <h3 className="text-lg font-semibold text-white">{player.player_name}</h3>
              <p className="text-gray-300 text-sm">
                {player.position} | {team.team_name} #{player.jersey_number}
              </p>
            </div>
          </div>
          <Link
            to={`/nba/player/${player.player_id}`}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                      text-white text-center py-2 px-4 rounded-lg transition-all duration-300 group-hover:scale-105"
          >
            View Profile
          </Link>
        </div>
      ))}
    </div>
  );

  const renderTableView = (team) => (
    <div className="overflow-x-auto bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg">
      <table className="w-full text-white">
        <thead>
          <tr className="bg-gray-700/50">
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("player_name")}
            >
              Player {sortBy === "player_name" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("position")}
            >
              Position {sortBy === "position" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("jersey_number")}
            >
              Jersey # {sortBy === "jersey_number" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-6 text-left font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((player, index) => (
            <tr
              key={player.player_id}
              className={`border-t border-gray-700 hover:bg-gray-700/50 transition-all duration-200 ${
                index % 2 === 0 ? "bg-gray-800/20" : ""
              }`}
            >
              <td className="py-4 px-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-600 rounded-full" />
                {player.player_name}
              </td>
              <td className="py-4 px-6">{player.position}</td>
              <td className="py-4 px-6">{player.jersey_number}</td>
              <td className="py-4 px-6">
                <Link
                  to={`/nba/player/${player.player_id}`}
                  className="text-blue-400 hover:text-cyan-300 transition-colors duration-200"
                >
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 pt-8 sticky top-0 backdrop-blur-md z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 animate-pulse">
              All Players
            </span>
          </h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 
                        focus:border-blue-500 text-white placeholder-gray-400 focus:outline-none 
                        transition-all duration-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid" ? "bg-blue-600" : "bg-gray-700/50 hover:bg-gray-600"
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list" ? "bg-blue-600" : "bg-gray-700/50 hover:bg-gray-600"
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg ${
                  viewMode === "table" ? "bg-blue-600" : "bg-gray-700/50 hover:bg-gray-600"
                }`}
                title="Table View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Players Section */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-cyan-300" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="space-y-12">
            {filteredPlayers.map((team) => (
              <div key={team.teamId}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    {team.team_name}
                  </h2>
                  <span className="text-sm text-gray-300">{team.players.length} Players</span>
                </div>
                {viewMode === "grid" && renderGridView(team)}
                {viewMode === "list" && renderListView(team)}
                {viewMode === "table" && renderTableView(team)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg py-12">No player data available</p>
        )}
      </section>
    </div>
  );
};

export default Players;