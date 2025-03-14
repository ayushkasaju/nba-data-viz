import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const TeamProfile = () => {
  const [teamProfile, setTeamProfile] = useState(null); // Start with null instead of empty object
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  const { teamId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/team/${teamId}`, {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTeamProfile(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching team data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <p>Loading team profile...</p>
      </div>
    );
  }

  if (error || !teamProfile?.team_info) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <p>Error loading team profile: {error || "No team data available"}</p>
      </div>
    );
  }

  const teamName = teamProfile.team_info[0]?.TEAM_FULL_NAME || "Unknown Team";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Bio Section */}
        <section className="mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {teamProfile.team_info[0]?.TEAM_LOGO && (
                <div className="relative flex-shrink-0">
                  <img
                    src={teamProfile.team_info[0].TEAM_LOGO}
                    alt={teamName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-blue-500 object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md -z-10 animate-pulse" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  {teamName}
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <p><span className="font-semibold text-blue-300">Conference:</span> {teamProfile.team_info[0]?.CONFERENCE || "N/A"}</p>
                  <p><span className="font-semibold text-blue-300">City:</span> {teamProfile.team_info[0]?.TEAM_CITY || "N/A"}</p>
                  <p><span className="font-semibold text-blue-300">Arena:</span> {teamProfile.team_info[0]?.ARENA || "N/A"}</p>
                  <p><span className="font-semibold text-blue-300">Owner:</span> {teamProfile.team_info[0]?.OWNER || "N/A"}</p>
                  <p><span className="font-semibold text-blue-300">General Manager:</span> {teamProfile.team_info[0]?.GENERAL_MANAGER || "N/A"}</p>
                  <p><span className="font-semibold text-blue-300">Head Coach:</span> {teamProfile.team_info[0]?.HEAD_COACH || "N/A"}</p>
                </div>
                <h2 className="text-lg font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  Season Record
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["WINS", "LOSSES", "WIN_PCT"].map(stat => (
                    <div key={stat} className="p-2 rounded-lg bg-gray-700/30 hover:bg-blue-500/20 transition-colors">
                      <span className="font-semibold text-blue-300">{stat === "WIN_PCT" ? "Win %" : stat}:</span> 
                      {stat === "WIN_PCT" 
                        ? `${(teamProfile.team_info[0]?.[stat] * 100 || 0).toFixed(1)}%`
                        : teamProfile.team_info[0]?.[stat] || "N/A"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeamProfile;