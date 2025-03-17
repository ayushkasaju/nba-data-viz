import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("last_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [teamFilter, setTeamFilter] = useState("all");

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

  // Get unique teams and positions for filter options
  const teams = Object.keys(players)
    .filter(teamId => teamId !== "0")
    .map(teamId => players[teamId].team_name)
    .sort();
  
  const positions = [...new Set(
    Object.keys(players)
      .filter(teamId => teamId !== "0")
      .flatMap(teamId => players[teamId].players.map(p => p.position))
  )].sort();

  // Filter and sort players
  const filteredPlayers = Object.keys(players)
    .filter(teamId => teamId !== "0")
    .flatMap(teamId => {
      const team = players[teamId];
      return team.players.map(player => ({
        ...player,
        team_name: team.team_name
      }));
    })
    .filter(player => 
      player.player_name.toLowerCase().includes(search.toLowerCase()) &&
      (teamFilter === "all" || player.team_name === teamFilter)
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
      {filteredPlayers.map((player) => (
        <div
          key={player.player_id}
          className="bg-gray-800/70 backdrop-blur-md rounded-xl p-5 border border-gray-700 
                    hover:border-blue-400 transition-all duration-300 group shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full" />
            <h3 className="text-lg font-semibold text-white">{player.player_name}</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            {player.position} | {player.team_name} #{player.jersey_number}
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

  const renderTableView = () => (
    <div className="overflow-x-auto bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg">
      <table className="w-full text-white">
        <thead>
          <tr className="bg-gray-700/50">
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("last_name")}
            >
              Player {sortBy === "last_name" && (sortOrder === "asc" ? "↑" : "↓")}
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
            <th className="py-3 px-6 text-left font-semibold">
              Team
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("scoring_grade")}
            >
              Scoring {sortBy === "scoring_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th 
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("playmaking_grade")}
            >
              Playmaking {sortBy === "playmaking_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th 
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("rebounding_grade")}
            >
              Rebounding {sortBy === "rebounding_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th 
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("defense_grade")}
            >
              Defense {sortBy === "defense_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th 
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("athleticism_grade")}
            >
              Athleticism {sortBy === "athleticism_grade" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-6 text-left font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredPlayers.map((player, index) => (
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
              <td className="py-4 px-6">{player.team_name}</td>
              <td className="py-4 px-6">{player.scoring_grade?.toFixed(1) || '-'}</td>
              <td className="py-4 px-6">{player.playmaking_grade?.toFixed(1) || '-'}</td>
              <td className="py-4 px-6">{player.rebounding_grade?.toFixed(1) || '-'}</td>
              <td className="py-4 px-6">{player.defense_grade?.toFixed(1) || '-'}</td>
              <td className="py-4 px-6">{player.athleticism_grade?.toFixed(1) || '-'}</td>
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
      <header className="container mx-auto px-4 pt-8 sticky top-0 backdrop-blur-md z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 animate-pulse">
              All Players
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 
                        focus:border-blue-500 text-white placeholder-gray-400 focus:outline-none 
                        transition-all duration-300"
            />
            <select
              value={teamFilter}
              onChange={handleTeamFilter}
              className="w-full sm:w-48 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 
                        focus:border-blue-500 text-white focus:outline-none transition-all duration-300"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
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
            {viewMode === "grid" && renderGridView()}
            {viewMode === "table" && renderTableView()}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg py-12">No player data available</p>
        )}
      </section>
    </div>
  );
};

export default Players;