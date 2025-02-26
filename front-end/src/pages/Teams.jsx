import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch(`/teams`);
      const data = await response.json();
      setTeams(data);
    };

    fetchTeams();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredTeams = Object.entries(teams)
  .filter(([_, team]) =>
    team.team_name.toLowerCase().includes(search.toLowerCase())
  )
  .map(([team_id, team]) => ({
    team_id,
    ...team,
  }));

  return (
    <div className="text-white">
      <div className="flex items-center justify-between m-4">
        <h1 className="text-4xl font-bold">All Teams</h1>
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={handleSearch}
          className="px-4 py-2 w-full sm:w-1/3 bg-gray-200 text-black rounded-md"
        />
      </div>
      {filteredTeams.length > 0 ? (
        <ul className="grid md:grid-cols-3 gap-8 px-4">
          {filteredTeams.map((team) => (
            <li
              key={team.team_id}
              className="w-full bg-[#EDFDFE] mx-auto shadow-xl flex flex-col p-6 my-4 rounded-lg hover:scale-105 duration-300 text-black"
            >
              <h2 className="text-xl font-bold text-center">{team.team_name}</h2>
              <p className="text-center">{team.record} | #{team.playoff_rank} in the {team.conference}</p>
              <Link
                className="bg-[#00a8e8] w-[200px] rounded-md font-medium text-center mx-auto py-3 text-white mt-4"
                to={`/nba/team/${team.team_id}`}
              >
                View Team
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center">No team data available</p>
      )}
    </div>
  );
};

export default Teams;
