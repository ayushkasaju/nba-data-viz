import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const [sortBy, setSortBy] = useState("playoff_rank"); // Sorting state
  const [sortOrder, setSortOrder] = useState("asc"); // Sort order: asc/desc

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/teams`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        console.error("Error fetching teams:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
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

  const filteredTeams = Object.entries(teams)
    .map(([team_id, team]) => ({ team_id, ...team }))
    .filter((team) => team.team_name.toLowerCase().includes(search.toLowerCase()));

  const sortedTeams = (conference) => {
    const filtered = filteredTeams.filter((team) => team.conference === conference);
    return filtered.sort((a, b) => {
      if (sortBy === "team_name") {
        return sortOrder === "asc"
          ? a.team_name.localeCompare(b.team_name)
          : b.team_name.localeCompare(a.team_name);
      } else if (sortBy === "record") {
        const [winsA, lossesA] = a.record.split("-").map(Number);
        const [winsB, lossesB] = b.record.split("-").map(Number);
        return sortOrder === "asc"
          ? winsA - winsB || lossesA - lossesB
          : winsB - winsA || lossesB - lossesA;
      }
      return sortOrder === "asc"
        ? a.playoff_rank - b.playoff_rank
        : b.playoff_rank - a.playoff_rank;
    });
  };

  const easternTeams = sortedTeams("East");
  const westernTeams = sortedTeams("West");

  const renderTable = (teamsList, conference) => (
    <div className="bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-700 overflow-hidden shadow-lg">
      <table className="w-full text-white">
        <thead>
          <tr className="bg-gray-700/50">
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("playoff_rank")}
            >
              Rank {sortBy === "playoff_rank" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("team_name")}
            >
              Team {sortBy === "team_name" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => handleSort("record")}
            >
              Record {sortBy === "record" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody>
          {teamsList.map((team, index) => (
            <tr
              key={team.team_id}
              className={`border-t border-gray-700 hover:bg-gray-700/50 transition-all duration-200 ${
                index % 2 === 0 ? "bg-gray-800/20" : ""
              }`}
            >
              <td className="py-4 px-6">
                <span className="flex items-center gap-2">
                  {team.playoff_rank}
                  {team.playoff_rank <= 6 && (
                    <span className="text-green-400 text-xs">✓ Playoffs</span>
                  )}
                  {team.playoff_rank > 6 && team.playoff_rank <= 10 && (
                    <span className="text-yellow-400 text-xs">◉ Play-In</span>
                  )}
                </span>
              </td>
              <td className="py-4 px-6">
                <Link
                  to={`/team/${team.team_id}`}
                  className="text-blue-400 hover:text-cyan-300 transition-colors duration-200 flex items-center gap-2"
                >
                  {/* Placeholder for team logo */}
                  <div className="w-6 h-6 bg-gray-600 rounded-full" />
                  {team.team_name}
                </Link>
              </td>
              <td className="py-4 px-6">{team.record}</td>
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
              NBA Standings
            </span>
          </h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 
                        focus:border-blue-500 text-white placeholder-gray-400 focus:outline-none 
                        transition-all duration-300"
            />
          </div>
        </div>
      </header>

      {/* Teams Section */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-cyan-300" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Eastern Conference */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                Eastern Conference
              </h2>
              {renderTable(easternTeams, "East")}
            </div>

            {/* Western Conference */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                Western Conference
              </h2>
              {renderTable(westernTeams, "West")}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg py-12">
            No team data available
          </p>
        )}
      </section>
    </div>
  );
};

export default Teams;