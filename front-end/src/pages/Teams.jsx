import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("playoff_rank");
  const [sortOrder, setSortOrder] = useState("asc");

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
    <div className="relative bg-gradient-to-br from-gray-800 to-black p-6 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300 shadow-md">
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-orange-500 rounded-full" />
      <table className="w-full text-white">
        <thead>
          <tr className="bg-gray-900/50">
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors"
              onClick={() => handleSort("playoff_rank")}
            >
              Rank {sortBy === "playoff_rank" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors"
              onClick={() => handleSort("team_name")}
            >
              Team {sortBy === "team_name" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="py-3 px-6 text-left font-semibold cursor-pointer hover:text-orange-400 transition-colors"
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
                    <span className="text-orange-400 text-xs">◉ Play-In</span>
                  )}
                </span>
              </td>
              <td className="py-4 px-6">
                <Link
                  to={`/team/${team.team_id}`}
                  className="text-orange-400 hover:text-orange-300 transition-colors duration-200 flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-md" />
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiPjwvcmVjdD48L3N2Zz4=')] opacity-20" />
      
      {/* Header */}
      <header className="container mx-auto px-4 pt-8 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="md:text-6xl sm:text-5xl text-3xl font-extrabold tracking-tight">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
              NBA Standings
            </span>
          </h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-800 
                        focus:border-yellow-500 text-white placeholder-gray-400 focus:outline-none 
                        transition-all duration-300 hover:border-blue-500"
            />
          </div>
        </div>
      </header>

      {/* Teams Section */}
      <section className="container mx-auto px-4 py-12 z-10 relative">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-orange-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Eastern Conference */}
            <div className="space-y-6">
              <h2 className="md:text-3xl sm:text-2xl text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Eastern Conference
              </h2>
              {renderTable(easternTeams, "East")}
            </div>

            {/* Western Conference */}
            <div className="space-y-6">
              <h2 className="md:text-3xl sm:text-2xl text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Western Conference
              </h2>
              {renderTable(westernTeams, "West")}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg py-12 font-medium">
            No team data available
          </p>
        )}
      </section>
    </div>
  );
};

export default Teams;