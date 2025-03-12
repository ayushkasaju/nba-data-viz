import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/teams`, {
        method: 'GET',
          redirect: 'follow',
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true' // Bypass ngrok warning
          }
      });
      const data = await response.json();
      setTeams(data);
    };

    fetchTeams();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredTeams = Object.entries(teams)
    .map(([team_id, team]) => ({ team_id, ...team }))
    .filter((team) =>
      team.team_name.toLowerCase().includes(search.toLowerCase())
    );

  const easternTeams = filteredTeams
    .filter((team) => team.conference === "East")
    .sort((a, b) => a.playoff_rank - b.playoff_rank);

  const westernTeams = filteredTeams
    .filter((team) => team.conference === "West")
    .sort((a, b) => a.playoff_rank - b.playoff_rank);

  return (
    <div className="text-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Standings</h1>
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={handleSearch}
          className="px-4 py-2 w-full sm:w-1/3 bg-gray-200 text-black rounded-md"
        />
      </div>
      {filteredTeams.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Eastern Conference */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Eastern Conference</h2>
            <table className="w-full text-black bg-white shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-300">
                  <th className="py-2 px-4 text-left">Rank</th>
                  <th className="py-2 px-4 text-left">Team</th>
                  <th className="py-2 px-4 text-left">Record</th>
                </tr>
              </thead>
              <tbody>
                {easternTeams.map((team) => (
                  <tr key={team.team_id} className="border-b">
                    <td className="py-2 px-4">{team.playoff_rank}</td>
                    <td className="py-2 px-4">
                      <Link
                        to={`/nba/team/${team.team_id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {team.team_name}
                      </Link>
                    </td>
                    <td className="py-2 px-4">{team.record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Western Conference */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Western Conference</h2>
            <table className="w-full text-black bg-white shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-300">
                  <th className="py-2 px-4 text-left">Rank</th>
                  <th className="py-2 px-4 text-left">Team</th>
                  <th className="py-2 px-4 text-left">Record</th>
                </tr>
              </thead>
              <tbody>
                {westernTeams.map((team) => (
                  <tr key={team.team_id} className="border-b">
                    <td className="py-2 px-4">{team.playoff_rank}</td>
                    <td className="py-2 px-4">
                      <Link
                        to={`/nba/team/${team.team_id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {team.team_name}
                      </Link>
                    </td>
                    <td className="py-2 px-4">{team.record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center">No team data available</p>
      )}
    </div>
  );
};

export default Teams;