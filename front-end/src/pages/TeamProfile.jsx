import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Function to dynamically import logos from the folder
const importLogo = (teamId) => {
  try {
    return require(`../assets/logos/${teamId}.png`); // Adjust path based on your folder structure
  } catch (err) {
    console.warn(`Logo not found for team ID: ${teamId}`);
    return null; // Fallback if logo is missing
  }
};

const TeamProfile = () => {
  const [teamProfile, setTeamProfile] = useState({
    team_info: [],
    team_players: [],
    team_standings: [],
  });
  const { teamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/team/${teamId}`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        const data = await response.json();
        setTeamProfile(data);
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    };
    fetchTeamData();
  }, [teamId]);

  const teamName = teamProfile.team_info.length > 0 ? teamProfile.team_info[0].TEAM_FULL_NAME : "";
  const teamLogo = importLogo(teamId); 
  const isJazz = teamId === "1610612762"

  const handlePlayerClick = (playerId) => {
    navigate(`/nba/player/${playerId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiPjwvcmVjdD48L3N2Zz4=')] opacity-20" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 z-10 relative">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-12">
          {teamLogo ? (
            <img
              src={teamLogo}
              alt={teamName}
              className={`w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-orange-500 object-cover mb-4 ${
                isJazz ? "bg-white p-2" : ""
              }`}
            />
          ) : (
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-orange-500 bg-gradient-to-br from-orange-500 to-red-600 mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{teamName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
            {teamName}
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            {teamProfile.team_info[0]?.CITY || "N/A"} • {teamProfile.team_standings[0]?.Conference || "N/A"}
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Team Overview */}
          <div className="lg:col-span-1 space-y-8">
            {/* Team Details */}
            <div className="p-6 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">
                Team Info
              </h2>
              <dl className="space-y-4">
                {[
                  { label: "Arena", value: teamProfile.team_info[0]?.ARENA || "N/A" },
                  { label: "Owner", value: teamProfile.team_info[0]?.OWNER || "N/A" },
                  { label: "General Manager", value: teamProfile.team_info[0]?.GENERALMANAGER || "N/A" },
                  { label: "Head Coach", value: teamProfile.team_info[0]?.HEADCOACH || "N/A" },
                  { label: "Founded", value: teamProfile.team_info[0]?.YEARFOUNDED || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-sm font-semibold text-orange-400 uppercase tracking-wide">
                      {label}
                    </dt>
                    <dd className="text-base text-gray-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Quick Stats */}
            <div className="p-6 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-orange-400 font-medium">Record</span>
                  <span className="text-gray-200">{teamProfile.team_standings[0]?.Record || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-400 font-medium">Conference</span>
                  <span className="text-gray-200">{teamProfile.team_standings[0]?.Conference || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-400 font-medium">Playoff Rank</span>
                  <span className="text-gray-200">{teamProfile.team_standings[0]?.PlayoffRank || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Roster and Additional Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Team Roster */}
            <div className="p-6 rounded-xl border border-gray-700 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">
                Team Roster
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {teamProfile.team_players.map((player) => (
                  <div
                    key={player.PLAYER_ID}
                    onClick={() => handlePlayerClick(player.PLAYER_ID)}
                    className="p-4 rounded-lg bg-gray-800/50 hover:bg-orange-500/20 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-orange-400">{player.PLAYER_FULL_NAME}</span>
                      <span className="block text-sm text-gray-300">{player.POSITION || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Games Placeholder */}
            <div className="p-6 rounded-xl border border-gray-700 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">
                Recent Games
              </h2>
              <div className="text-center text-gray-400">
                <p>Game history coming soon...</p>
                <div className="mt-4 space-y-2">
                  <div className="h-12 bg-gray-700/30 rounded-lg animate-pulse" />
                  <div className="h-12 bg-gray-700/30 rounded-lg animate-pulse" />
                  <div className="h-12 bg-gray-700/30 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;