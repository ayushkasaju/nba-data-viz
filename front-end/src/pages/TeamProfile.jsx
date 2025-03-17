import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const TeamProfile = () => {
  const [team, setTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const { teamId } = useParams();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/team/${teamId}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
        });
        const data = await response.json();
        setTeam(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team data:", error);
        setLoading(false);
      }
    };
    fetchTeamData();
  }, [teamId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-white">
          {payload.map((ele, index) => (
            <div key={index}>
              <span className="text-blue-300">{ele.name}: {ele.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Sample data for team performance chart (you'd typically fetch this from another endpoint)
  const performanceData = [
    { name: "Wins", value: team.record ? parseInt(team.record.split('-')[0]) : 0 },
    { name: "Losses", value: team.record ? parseInt(team.record.split('-')[1]) : 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Team Info Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                {team.team_name || "Team Not Found"}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <p>
                  <span className="font-semibold text-blue-300">City:</span> {team.city || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">Arena:</span> {team.arena || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">Owner:</span> {team.owner || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">General Manager:</span> {team.general_manager || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">Head Coach:</span> {team.head_coach || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">Conference:</span> {team.conference || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">Record:</span> {team.record || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-blue-300">Playoff Rank:</span> {team.playoff_rank || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Chart Section */}
        <section className="mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Season Performance
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
                <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === "Wins" ? "#00DF4C" : "#FF4747"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Additional Team Stats could go here */}
        {/* You could add more sections for roster, recent games, etc. */}
      </div>
    </div>
  );
};

export default TeamProfile;