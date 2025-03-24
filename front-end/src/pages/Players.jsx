import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Function to dynamically import headshots from the folder
const importHeadshot = (playerId) => {
  try {
    return require(`../assets/headshots/${playerId}.png`); // Adjust path based on your folder structure
  } catch (err) {
    console.warn(`Headshot not found for player ID: ${playerId}`);
    return null; // Fallback if headshot is missing
  }
};

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("last_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [teamFilter, setTeamFilter] = useState("all");
  const [archetypeFilter, setArchetypeFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

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

  const handleSearch = (e) => setSearch(e.target.value);
  const handleTeamFilter = (e) => setTeamFilter(e.target.value);
  const handleArchetypeFilter = (e) => setArchetypeFilter(e.target.value);
  const handlePositionFilter = (e) => setPositionFilter(e.target.value);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getLastName = (fullName) => {
    const nameParts = fullName.trim().split(" ");
    return nameParts[nameParts.length - 1];
  };

  const teams = Object.keys(players)
    .filter((teamId) => teamId !== "0")
    .map((teamId) => players[teamId].team_name)
    .sort();

  const positions = [
    ...new Set(
      Object.keys(players)
        .filter((teamId) => teamId !== "0")
        .flatMap((teamId) => players[teamId].players.map((p) => p.position))
    ),
  ].sort();

  const archetypes = [
    ...new Set(
      Object.keys(players)
        .filter((teamId) => teamId !== "0")
        .flatMap((teamId) => players[teamId].players.map((p) => p.archetype).filter((a) => a))
    ),
  ].sort();

  const filteredPlayers = Object.keys(players)
    .filter((teamId) => teamId !== "0")
    .flatMap((teamId) => {
      const team = players[teamId];
      return team.players.map((player) => ({
        ...player,
        team_name: team.team_name,
      }));
    })
    .filter(
      (player) =>
        player.player_name.toLowerCase().includes(search.toLowerCase()) &&
        (teamFilter === "all" || player.team_name === teamFilter) &&
        (archetypeFilter === "all" || player.archetype === archetypeFilter) &&
        (positionFilter === "all" || player.position === positionFilter)
    )
    .sort((a, b) => {
      if (sortBy === "last_name") {
        const lastNameA = getLastName(a.player_name);
        const lastNameB = getLastName(b.player_name);
        return sortOrder === "asc"
          ? lastNameA.localeCompare(lastNameB)
          : lastNameB.localeCompare(lastNameA);
      } else if (sortBy === "position") {
        return sortOrder === "asc"
          ? a.position.localeCompare(b.position)
          : b.position.localeCompare(a.position);
      } else if (sortBy === "jersey_number") {
        return sortOrder === "asc"
          ? a.jersey_number - b.jersey_number
          : b.jersey_number - a.jersey_number;
      } else if (sortBy === "scoring_grade") {
        return sortOrder === "desc"
          ? (a.scoring_grade || 0) - (b.scoring_grade || 0)
          : (b.scoring_grade || 0) - (a.scoring_grade || 0);
      } else if (sortBy === "playmaking_grade") {
        return sortOrder === "desc"
          ? (a.playmaking_grade || 0) - (b.playmaking_grade || 0)
          : (b.playmaking_grade || 0) - (a.playmaking_grade || 0);
      } else if (sortBy === "rebounding_grade") {
        return sortOrder === "desc"
          ? (a.rebounding_grade || 0) - (b.rebounding_grade || 0)
          : (b.rebounding_grade || 0) - (a.rebounding_grade || 0);
      } else if (sortBy === "defense_grade") {
        return sortOrder === "desc"
          ? (a.defense_grade || 0) - (b.defense_grade || 0)
          : (b.defense_grade || 0) - (a.defense_grade || 0);
      } else if (sortBy === "athleticism_grade") {
        return sortOrder === "desc"
          ? (a.athleticism_grade || 0) - (b.athleticism_grade || 0)
          : (b.athleticism_grade || 0) - (a.athleticism_grade || 0);
      }
      return 0;
    });

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {filteredPlayers.map((player) => {
        const headshot = importHeadshot(player.player_id);
        return (
          <div
            key={player.player_id}
            className="relative bg-gradient-to-br from-gray-800 to-black p-5 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300 shadow-md"
          >
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full" />
            <div className="flex items-center gap-3 mb-4">
              {headshot ? (
                <img
                  src={headshot}
                  alt={player.player_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{player.player_name.charAt(0)}</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-white">{player.player_name}</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 font-medium">
              {player.position} | {player.team_name} #{player.jersey_number}
            </p>
            <Link
              to={`/nba/player/${player.player_id}`}
              className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center"
            >
              View Profile
            </Link>
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-white border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-gray-900">
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("last_name")}
            >
              Player {sortBy === "last_name" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("position")}
            >
              Pos {sortBy === "position" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-4 text-left font-semibold text-sm">
              Archetype
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("jersey_number")}
            >
              # {sortBy === "jersey_number" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-4 text-left font-semibold text-sm">
              Team
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("scoring_grade")}
            >
              Scoring {sortBy === "scoring_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("playmaking_grade")}
            >
              Playmaking {sortBy === "playmaking_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("rebounding_grade")}
            >
              Rebounding {sortBy === "rebounding_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("defense_grade")}
            >
              Defense {sortBy === "defense_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors text-sm"
              onClick={() => handleSort("athleticism_grade")}
            >
              Athleticism {sortBy === "athleticism_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-4 text-left font-semibold text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredPlayers.map((player, index) => {
            const headshot = importHeadshot(player.player_id);
            return (
              <tr
                key={player.player_id}
                className={`border-t border-gray-700 hover:bg-gray-700/50 transition-all duration-200 ${
                  index % 2 === 0 ? "bg-gray-800/20" : ""
                }`}
              >
                <td className="py-3 px-4 text-sm flex items-center gap-2">
                  {headshot ? (
                    <img
                      src={headshot}
                      alt={player.player_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{player.player_name.charAt(0)}</span>
                    </div>
                  )}
                  {player.player_name}
                </td>
                <td className="py-3 px-4 text-sm">{player.position}</td>
                <td className="py-3 px-4 text-sm">{player.archetype || "N/A"}</td>
                <td className="py-3 px-4 text-sm">{player.jersey_number}</td>
                <td className="py-3 px-4 text-sm">{player.team_name}</td>
                <td className="py-3 px-4 text-sm">{player.scoring_grade?.toFixed(1) || "-"}</td>
                <td className="py-3 px-4 text-sm">{player.playmaking_grade?.toFixed(1) || "-"}</td>
                <td className="py-3 px-4 text-sm">{player.rebounding_grade?.toFixed(1) || "-"}</td>
                <td className="py-3 px-4 text-sm">{player.defense_grade?.toFixed(1) || "-"}</td>
                <td className="py-3 px-4 text-sm">{player.athleticism_grade?.toFixed(1) || "-"}</td>
                <td className="py-3 px-4 text-sm">
                  <Link
                    to={`/nba/player/${player.player_id}`}
                    className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiPjwvcmVjdD48L3N2Zz4=')] opacity-20" />

      {/* Header */}
      <header className="container mx-auto px-4 pt-8 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="md:text-6xl sm:text-5xl text-3xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
              All Players
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-800 
                        focus:border-yellow-500 text-white placeholder-gray-400 focus:outline-none 
                        transition-all duration-300 hover:border-blue-500"
            />
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <select
                value={teamFilter}
                onChange={handleTeamFilter}
                className="w-full sm:w-48 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-800 
                          focus:border-yellow-500 text-white focus:outline-none transition-all duration-300 hover:border-blue-500"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              <select
                value={positionFilter}
                onChange={handlePositionFilter}
                className="w-full sm:w-48 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-800 
                          focus:border-yellow-500 text-white focus:outline-none transition-all duration-300 hover:border-blue-500"
              >
                <option value="all">All Positions</option>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <select
                value={archetypeFilter}
                onChange={handleArchetypeFilter}
                className="w-full sm:w-48 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-800 
                          focus:border-yellow-500 text-white focus:outline-none transition-all duration-300 hover:border-blue-500"
              >
                <option value="all">All Archetypes</option>
                {archetypes.map((archetype) => (
                  <option key={archetype} value={archetype}>
                    {archetype}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg bg-gray-900/80 border border-gray-800 hover:border-yellow-500 
                          transition-all duration-300 ${
                            viewMode === "grid" ? "border-yellow-500 shadow-[0_0_10px_rgba(255,255,0,0.5)]" : ""
                          }`}
                title="Grid View"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg bg-gray-900/80 border border-gray-800 hover:border-yellow-500 
                          transition-all duration-300 ${
                            viewMode === "table" ? "border-yellow-500 shadow-[0_0_10px_rgba(255,255,0,0.5)]" : ""
                          }`}
                title="Table View"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Players Section */}
      <section className="container mx-auto px-4 py-12 z-10 relative">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-orange-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="space-y-12">
            {viewMode === "grid" && renderGridView()}
            {viewMode === "table" && renderTableView()}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg py-12 font-medium">No player data available</p>
        )}
      </section>
    </div>
  );
};

export default Players;