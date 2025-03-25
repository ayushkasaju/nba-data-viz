import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LabelList,
} from "recharts";

// Function to dynamically import headshots from the folder
const importHeadshot = (playerId) => {
  try {
    return require(`../assets/headshots/${playerId}.png`);
  } catch (err) {
    console.warn(`Headshot not found for player ID: ${playerId}`);
    return null;
  }
};

// Utility function to filter games
const filterGames = (gamelogs, filters, teammateGameIds) => {
  const { opponent, minutes, winLoss, teammateFilter, xGames } = filters;
  const teammateGameIdSet = new Set(teammateGameIds);

  return gamelogs
    .filter((game) => {
      return [
        !opponent || game.opp === opponent,
        !minutes || game.mins_played >= minutes,
        !winLoss || game.outcome === winLoss,
        !teammateFilter ||
          (teammateFilter === "with"
            ? teammateGameIdSet.has(game.game_id)
            : !teammateGameIdSet.has(game.game_id)),
      ].every(Boolean);
    })
    .slice(-xGames);
};

const Profile = () => {
  const [profile, setProfile] = useState({
    player_info: [],
    gamelogs: [],
    player_grades: [],
  });
  const [selectedStat, setSelectedStat] = useState("pts");
  const [xGames, setXGames] = useState(30);
  const [thresholdValue, setThresholdValue] = useState(17.5);
  const [opponent, setOpponent] = useState(null);
  const [minutes, setMinutes] = useState(0);
  const [winLoss, setWinLoss] = useState(null);
  const [teammates, setTeammates] = useState([]);
  const [selectedTeammate, setSelectedTeammate] = useState(null);
  const [teammateGamelogs, setTeammateGamelogs] = useState([]);
  const [filterTeammate, setFilterTeammate] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [radarPlayers, setRadarPlayers] = useState([]);
  const [radarPlayerProfiles, setRadarPlayerProfiles] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedTab, setSelectedTab] = useState("overview");

  const { sport, playerId } = useParams();
  const navigate = useNavigate();

  const statCategories = [
    { key: "pts", label: "Points" },
    { key: "reb", label: "Rebounds" },
    { key: "ast", label: "Assists" },
    { key: "stl", label: "Steals" },
    { key: "blk", label: "Blocked Shots" },
    { key: "tov", label: "Turnovers" },
    { key: "fg_made", label: "Field Goals Made" },
    { key: "fg_att", label: "Field Goals Attempted" },
    { key: "fg3_made", label: "3-PT Made" },
    { key: "fg3_att", label: "3-PT Attempted" },
    { key: "ft_made", label: "Free Throws Made" },
    { key: "ft_att", label: "Free Throws Attempted" },
    { key: "oreb", label: "Offensive Rebounds" },
    { key: "dreb", label: "Defensive Rebounds" },
    { key: "pra", label: "Points + Rebounds + Assists" },
    { key: "pr", label: "Points + Rebounds" },
    { key: "pa", label: "Points + Assists" },
    { key: "ra", label: "Rebounds + Assists" },
    { key: "fantasy", label: "Fantasy Score" },
  ];

  const radarCategories = ["Scoring", "Playmaking", "Rebounding", "Defense", "Athleticism"];

  // Fetch player data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/nba/player/${playerId}`, {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" },
        });
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };
    fetchData();
  }, [playerId]);

  // Fetch teammates
  useEffect(() => {
    const fetchTeammates = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/players`, {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" },
        });
        const data = await response.json();
        const playerTeamId = profile.player_info[0]?.TEAM_ID;
        if (playerTeamId && data[playerTeamId]) {
          setTeammates(data[playerTeamId].players);
        }
        const allPlayersList = Object.values(data).flatMap((team) => team.players);
        setAllPlayers(allPlayersList);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };
    fetchTeammates();
  }, [profile]);

  // Fetch teammate gamelogs
  useEffect(() => {
    const fetchTeammateGamelogs = async () => {
      if (!selectedTeammate) {
        setTeammateGamelogs([]);
        return;
      }
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/${sport}/player/${selectedTeammate}`, {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" },
        });
        const data = await response.json();
        setTeammateGamelogs(data.gamelogs || []);
      } catch (error) {
        console.error("Error fetching teammate gamelogs:", error);
        setTeammateGamelogs([]);
      }
    };
    fetchTeammateGamelogs();
  }, [selectedTeammate, sport]);

  // Fetch radar player profiles
  useEffect(() => {
    const fetchRadarPlayerProfiles = async () => {
      const newRadarProfiles = {};
      for (const playerId of radarPlayers) {
        if (!radarPlayerProfiles[playerId]) {
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/${sport}/player/${playerId}`, {
              method: "GET",
              redirect: "follow",
              headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" },
            });
            const data = await response.json();
            newRadarProfiles[playerId] = data;
          } catch (error) {
            console.error(`Error fetching radar player ${playerId} data:`, error);
          }
        }
      }
      setRadarPlayerProfiles((prev) => ({ ...prev, ...newRadarProfiles }));
    };
    if (radarPlayers.length > 0) {
      fetchRadarPlayerProfiles();
    }
  }, [radarPlayers, sport]);

  // Preprocess teammate game IDs
  const teammateGameIds = useMemo(
    () => teammateGamelogs.map((game) => game.game_id),
    [teammateGamelogs]
  );

  // Filter criteria
  const filterCriteria = {
    opponent,
    minutes,
    winLoss,
    teammateFilter: filterTeammate,
    xGames,
  };

  // Compute filtered games
  const filteredGames = useMemo(
    () => filterGames(profile.gamelogs, filterCriteria, teammateGameIds),
    [profile.gamelogs, filterCriteria, teammateGameIds]
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const game = payload[0]?.payload;
      const statLabel = statCategories.find((stat) => stat.key === selectedStat)?.label || selectedStat;
      return (
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-white text-sm shadow-md">
          <span>{game?.game_date || "Date not available"}</span>
          <br />
          <span>{game?.opp ? `vs. ${game.opp}` : "Opponent not available"}</span>
          <br />
          {payload.map((ele, index) => (
            <div key={index}>
              <span className="text-orange-400">{ele.value} {statLabel}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const radarData = radarCategories.map((stat) => {
    const dataPoint = { stat };
    dataPoint[playerId] = Number((profile.player_grades[0]?.[stat] || 0).toFixed(1));
    radarPlayers.forEach((playerId) => {
      const playerGrades = radarPlayerProfiles[playerId]?.player_grades[0];
      dataPoint[playerId] = Number((playerGrades?.[stat] || 0).toFixed(1));
    });
    return dataPoint;
  });

  const playerName = profile.player_info.length > 0 ? profile.player_info[0].PLAYER_FULL_NAME : "";
  const headshot = importHeadshot(playerId);
  const reversedTableGames = [...profile.gamelogs].reverse();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reversedTableGames.slice(indexOfFirstRow, indexOfLastRow);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const radarColors = [
    "#FF6B00", "#9333EA", "#FF4500", "#00FF00", "#FFD700", "#1E90FF", "#FF1493", "#00CED1", "#FF8C00",
    "#32CD32", "#4169E1", "#FF69B4", "#ADFF2F", "#DC143C", "#00B7EB", "#FFA500",
  ];
  const filteredPlayers = allPlayers
    .filter(
      (player) =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) && player.player_id !== playerId
    )
    .slice(0, 10);

  const handlePlayerSelect = (playerId) => {
    if (!radarPlayers.includes(playerId) && radarPlayers.length < 4) {
      setRadarPlayers([...radarPlayers, playerId]);
    }
    setSearchTerm("");
  };

  const removeRadarPlayer = (playerId) => {
    setRadarPlayers(radarPlayers.filter((id) => id !== playerId));
  };

  const gamesOverThreshold = filteredGames.filter((game) => game[selectedStat] > thresholdValue).length;
  const totalGames = filteredGames.length;
  const percentageOver = totalGames > 0 ? ((gamesOverThreshold / totalGames) * 100).toFixed(1) : 0;

  const handleTeamClick = (teamId) => navigate(`/team/${teamId}`);
  const handleTeammateClick = (teammateId) => navigate(`/player/${teammateId}`);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiPjwvcmVjdD48L3N2Zz4=')] opacity-20" />

      {/* Mobile Header (Fixed) */}
      <div className="md:hidden fixed top-15 left-0 right-0 bg-gray-900/90 backdrop-blur-sm z-20 p-4 flex items-center border-b border-gray-700">
        {headshot ? (
          <img
            src={headshot}
            alt={playerName}
            className="w-12 h-12 rounded-full border-2 border-orange-500 object-cover mr-3"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-3">
            <span className="text-white text-lg font-bold">{playerName.charAt(0)}</span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
            {playerName}
          </h1>
          <p className="text-sm text-gray-400">
            <span onClick={() => handleTeamClick(profile.player_info[0]?.TEAM_ID)} className="cursor-pointer hover:text-orange-400">
              {profile.player_info[0]?.TEAM_FULL_NAME || "N/A"}
            </span>{" "}
            • {profile.player_info[0]?.POSITION || "N/A"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-12 z-10 relative md:pt-12 pt-20">
        {/* Desktop Header */}
        <div className="hidden md:flex flex-col items-center mb-12">
          {headshot ? (
            <img
              src={headshot}
              alt={playerName}
              className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-orange-500 object-cover mb-4"
            />
          ) : (
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-orange-500 bg-gradient-to-br from-orange-500 to-red-600 mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{playerName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 p-2">
            {playerName}
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            <span onClick={() => handleTeamClick(profile.player_info[0]?.TEAM_ID)} className="cursor-pointer hover:text-orange-400">
              {profile.player_info[0]?.TEAM_FULL_NAME || "N/A"}
            </span>{" "}
            • {profile.player_info[0]?.POSITION || "N/A"}
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Player Overview */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-6 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">Player Info</h2>
              <dl className="space-y-4">
                {[
                  { label: "Height", value: profile.player_info[0]?.HEIGHT || "N/A" },
                  { label: "Weight", value: profile.player_info[0]?.WEIGHT || "Nchecker/A" },
                  { label: "College", value: profile.player_info[0]?.COLLEGE || "N/A" },
                  {
                    label: "Draft",
                    value: profile.player_info[0]?.DRAFT_YEAR !== 0
                      ? `${profile.player_info[0]?.DRAFT_YEAR} R${profile.player_info[0]?.DRAFT_ROUND} P${profile.player_info[0]?.DRAFT_NUMBER}`
                      : "Undrafted",
                  },
                  { label: "Archetype", value: profile.player_grades[0]?.Archetype || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-sm font-semibold text-orange-400 uppercase tracking-wide">{label}</dt>
                    <dd className="text-base text-gray-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="p-6 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">Season Averages</h2>
              <div className="space-y-4">
                {[
                  { label: "Points", value: profile.player_grades[0]?.PTS || "N/A" },
                  { label: "Rebounds", value: profile.player_grades[0]?.REB || "N/A" },
                  { label: "Assists", value: profile.player_grades[0]?.AST || "N/A" },
                  { label: "Blocks", value: profile.player_grades[0]?.BLK || "N/A" },
                  { label: "Steals", value: profile.player_grades[0]?.STL || "N/A" },
                  { label: "Turnovers", value: profile.player_grades[0]?.TOV || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-orange-400 font-medium">{label}</span>
                    <span className="text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">Teammates</h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {teammates
                  .filter((teammate) => teammate.player_id !== playerId)
                  .map((teammate) => (
                    <div
                      key={teammate.player_id}
                      onClick={() => handleTeammateClick(teammate.player_id)}
                      className="p-3 rounded-lg bg-gray-800/50 hover:bg-orange-500/20 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold">{teammate.player_name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Column: Charts and Game Logs */}
          <div className="lg:col-span-3 space-y-8">
            {profile.player_grades[0] && (
              <div className="p-6 rounded-xl border border-gray-700 shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">Player Comparison</h2>
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-md mb-4 relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Compare up to 5 players..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md"
                    />
                    {searchTerm && (
                      <div className="absolute z-20 bg-gray-900 border border-gray-700 rounded-xl mt-1 max-h-40 overflow-y-auto w-full max-w-[90vw] md:max-w-md shadow-md top-full left-0">
                        {filteredPlayers.map((player) => (
                          <div
                            key={player.player_id}
                            onClick={() => handlePlayerSelect(player.player_id)}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-sm text-white transition-all duration-200 truncate"
                          >
                            {player.player_name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {radarPlayers.map((playerId, index) => (
                        <div
                          key={playerId}
                          className="flex items-center bg-gray-900/50 rounded-xl px-2 py-1 text-xs border"
                          style={{ borderColor: radarColors[(index + 1) % radarColors.length] }}
                        >
                          {radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Loading..."}
                          <button
                            onClick={() => removeRadarPlayer(playerId)}
                            className="ml-2 text-orange-400 hover:text-orange-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={radarPlayers.length > 0 ? 400 : 350}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#4B5563" />
                      <PolarRadiusAxis domain={[0, 100]} stroke="none" />
                      <PolarAngleAxis dataKey="stat" tick={{ fill: "#fff", fontSize: 12 }} />
                      <Radar
                        name={playerName}
                        dataKey={playerId}
                        stroke={radarColors[0]}
                        strokeWidth={2}
                        fill={radarColors[0]}
                        fillOpacity={0.4}
                      >
                        {radarPlayers.length === 0 && (
                          <LabelList
                            dataKey={playerId}
                            position="outside"
                            content={({ x, y, value }) => {
                              const color =
                                value <= 45 ? "#FF2F2F" : value >= 65 && value < 80 ? "#1CDA5C" : value >= 80 ? "#354BFE" : "#FFC516";
                              return (
                                <>
                                  <rect x={x - 16} y={y - 10} width={32} height={20} fill={color} rx={4} />
                                  <text x={x} y={y} fill="white" fontSize={12} textAnchor="middle" alignmentBaseline="middle">
                                    {value}
                                  </text>
                                </>
                              );
                            }}
                          />
                        )}
                      </Radar>
                      {radarPlayers.map((playerId, index) => {
                        const playerName = radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Player";
                        return (
                          <Radar
                            key={playerId}
                            name={playerName}
                            dataKey={playerId}
                            stroke={radarColors[(index + 1) % radarColors.length]}
                            strokeWidth={2}
                            fill={radarColors[(index + 1) % radarColors.length]}
                            fillOpacity={0.2}
                          />
                        );
                      })}
                    </RadarChart>
                  </ResponsiveContainer>
                  {radarPlayers.length > 0 && (
                    <div className="mt-4 w-full">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-900/50">
                          <tr>
                            <th className="p-2">Player</th>
                            {radarCategories.map((stat) => (
                              <th key={stat} className="p-2 text-center">
                                {stat.slice(0, 3)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-700">
                            <td className="p-2 flex items-center">
                              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: radarColors[0] }}></span>
                              {playerName}
                            </td>
                            {radarCategories.map((stat) => (
                              <td key={stat} className="p-2 text-center">
                                {(profile.player_grades[0]?.[stat] || 0).toFixed(1)}
                              </td>
                            ))}
                          </tr>
                          {radarPlayers.map((playerId, index) => (
                            <tr key={playerId} className="border-t border-gray-700">
                              <td className="p-2 flex items-center">
                                <span
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: radarColors[(index + 1) % radarColors.length] }}
                                ></span>
                                {radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Loading..."}
                              </td>
                              {radarCategories.map((stat) => (
                                <td key={stat} className="p-2 text-center">
                                  {(radarPlayerProfiles[playerId]?.player_grades[0]?.[stat] || 0).toFixed(1)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="p-6 rounded-xl border border-gray-700 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">Performance Trends</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    step="0.5"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-center text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    placeholder="Threshold"
                  />
                  <select
                    value={xGames}
                    onChange={(e) => setXGames(Number(e.target.value))}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                  >
                    <option value="all">Season</option>
                    {[30, 20, 15, 10, 5].map((n) => (
                      <option key={n} value={n}>{n} games</option>
                    ))}
                  </select>
                  <select
                    value={opponent || ""}
                    onChange={(e) => setOpponent(e.target.value || null)}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                  >
                    <option value="">All Opponents</option>
                    {["ATL", "BKN", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", "OKC", "ORL", "PHI", "PHX", "POR", "SAS", "SAC", "TOR", "UTA", "WAS"].map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  <select
                    value={minutes || ""}
                    onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                  >
                    <option value="">All Minutes</option>
                    {[10, 20, 25, 28, 30, 32, 34, 40].map((m) => (
                      <option key={m} value={m}>{m}+ Minutes</option>
                    ))}
                  </select>
                  <select
                    value={winLoss || ""}
                    onChange={(e) => setWinLoss(e.target.value || null)}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                  >
                    <option value="">All Games</option>
                    <option value="W">Wins Only</option>
                    <option value="L">Losses Only</option>
                  </select>
                  <select
                    value={selectedTeammate || ""}
                    onChange={(e) => setSelectedTeammate(e.target.value || null)}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                  >
                    <option value="">Select Teammate</option>
                    {teammates.map((teammate) => (
                      <option key={teammate.player_id} value={teammate.player_id}>{teammate.player_name}</option>
                    ))}
                  </select>
                  {selectedTeammate && (
                    <select
                      value={filterTeammate || ""}
                      onChange={(e) => setFilterTeammate(e.target.value || null)}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    >
                      <option value="">All Games</option>
                      <option value="with">With Teammate</option>
                      <option value="without">Without Teammate</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2">
                  {statCategories.map((stat) => (
                    <button
                      key={stat.key}
                      onClick={() => setSelectedStat(stat.key)}
                      className={`px-3 py-1 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                        selectedStat === stat.key
                          ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md"
                          : "border border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                      }`}
                    >
                      {stat.label}
                    </button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredGames} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis dataKey="game_date" stroke="#fff" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#fff" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={selectedStat} radius={[6, 6, 0, 0]}>
                      {filteredGames.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry[selectedStat] < thresholdValue ? "#FF4747" : entry[selectedStat] > thresholdValue ? "#00DF4C" : "#8C8C89"}
                        />
                      ))}
                    </Bar>
                    <ReferenceLine y={thresholdValue} stroke="#fff" strokeDasharray="5 5" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-400">
                  Over {thresholdValue} {statCategories.find((stat) => stat.key === selectedStat)?.label || selectedStat} in {gamesOverThreshold} of {totalGames} games ({percentageOver}%)
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-gray-700 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-orange-400 border-b border-orange-500 pb-2">Game Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="bg-gray-900/50">
                    <tr>
                      {["Date", "Matchup", "W/L", "Mins", "FG", "FG%", "3PT", "3PT%", "FT", "FT%", "Reb", "Ast", "Blk", "Stl", "PF", "Pts"].map((header) => (
                        <th key={header} className="p-3 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((game, index) => (
                      <tr key={index} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="p-3">{game.game_date}</td>
                        <td className="p-3">{game.matchup}</td>
                        <td className="p-3">{game.outcome}</td>
                        <td className="p-3">{game.mins_played}</td>
                        <td className="p-3">{game.fg_made}-{game.fg_att}</td>
                        <td className="p-3">{`${Math.round(game.fg_pct * 10000) / 100}%`}</td>
                        <td className="p-3">{game.fg3_made}-{game.fg3_att}</td>
                        <td className="p-3">{`${Math.round(game.fg3_pct * 10000) / 100}%`}</td>
                        <td className="p-3">{game.ft_made}-{game.ft_att}</td>
                        <td className="p-3">{`${Math.round(game.ft_pct * 10000) / 100}%`}</td>
                        <td className="p-3">{game.reb}</td>
                        <td className="p-3">{game.ast}</td>
                        <td className="p-3">{game.blk}</td>
                        <td className="p-3">{game.stl}</td>
                        <td className="p-3">{game.foul}</td>
                        <td className="p-3">{game.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastRow >= profile.gamelogs.length}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout with Tabs */}
        <div className="md:hidden space-y-6 pb-20 mt-6">
          {selectedTab === "overview" && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
                <h2 className="text-lg font-semibold mb-3 text-orange-400 border-b border-orange-500 pb-2">Player Info</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Height", value: profile.player_info[0]?.HEIGHT || "N/A" },
                    { label: "Weight", value: profile.player_info[0]?.WEIGHT || "N/A" },
                    { label: "College", value: profile.player_info[0]?.COLLEGE || "N/A" },
                    {
                      label: "Draft",
                      value: profile.player_info[0]?.DRAFT_YEAR !== 0
                        ? `${profile.player_info[0]?.DRAFT_YEAR} R${profile.player_info[0]?.DRAFT_ROUND}`
                        : "Undrafted",
                    },
                    { label: "Archetype", value: profile.player_grades[0]?.Archetype || "N/A" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col">
                      <dt className="text-xs font-semibold text-orange-400 uppercase tracking-wide">{label}</dt>
                      <dd className="text-sm text-gray-200">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="p-4 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
                <h2 className="text-lg font-semibold mb-3 text-orange-400 border-b border-orange-500 pb-2">Season Averages</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Points", value: profile.player_grades[0]?.PTS || "N/A" },
                    { label: "Rebounds", value: profile.player_grades[0]?.REB || "N/A" },
                    { label: "Assists", value: profile.player_grades[0]?.AST || "N/A" },
                    { label: "Blocks", value: profile.player_grades[0]?.BLK || "N/A" },
                    { label: "Steals", value: profile.player_grades[0]?.STL || "N/A" },
                    { label: "Turnovers", value: profile.player_grades[0]?.TOV || "N/A" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-orange-400 text-sm font-medium">{label}</span>
                      <span className="text-gray-200 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-gray-700 shadow-md bg-gray-800/20">
                <h2 className="text-lg font-semibold mb-3 text-orange-400 border-b border-orange-500 pb-2">Teammates</h2>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {teammates
                    .filter((teammate) => teammate.player_id !== playerId)
                    .map((teammate) => (
                      <div
                        key={teammate.player_id}
                        onClick={() => handleTeammateClick(teammate.player_id)}
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-orange-500/20 transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-sm">{teammate.player_name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === "trends" && (
            <div className="space-y-6">
              {profile.player_grades[0] && (
                <div className="p-4 rounded-xl border border-gray-700 shadow-md">
                  <h2 className="text-lg font-semibold mb-3 text-orange-400 border-b border-orange-500 pb-2">Player Comparison</h2>
                  <div className="flex flex-col items-center">
                    <div className="w-full mb-4 relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Compare up to 5 players..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md"
                      />
                      {searchTerm && (
                        <div className="absolute z-20 bg-gray-900 border border-gray-700 rounded-xl mt-1 max-h-40 overflow-y-auto w-full max-w-[90vw] md:max-w-md shadow-md top-full left-0">
                          {filteredPlayers.map((player) => (
                            <div
                              key={player.player_id}
                              onClick={() => handlePlayerSelect(player.player_id)}
                              className="p-2 hover:bg-gray-700 cursor-pointer text-sm text-white transition-all duration-200 truncate"
                            >
                              {player.player_name}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {radarPlayers.map((playerId, index) => (
                          <div
                            key={playerId}
                            className="flex items-center bg-gray-900/50 rounded-xl px-2 py-1 text-xs border"
                            style={{ borderColor: radarColors[(index + 1) % radarColors.length] }}
                          >
                            {radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Loading..."}
                            <button
                              onClick={() => removeRadarPlayer(playerId)}
                              className="ml-2 text-orange-400 hover:text-orange-300"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={radarPlayers.length > 0 ? 300 : 250}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#4B5563" />
                        <PolarRadiusAxis domain={[0, 100]} stroke="none" />
                        <PolarAngleAxis dataKey="stat" tick={{ fill: "#fff", fontSize: 10 }} tickFormatter={(value) => value.slice(0, 3)} />
                        <Radar
                          name={playerName}
                          dataKey={playerId}
                          stroke={radarColors[0]}
                          strokeWidth={2}
                          fill={radarColors[0]}
                          fillOpacity={0.4}
                        >
                          {radarPlayers.length === 0 && (
                            <LabelList
                              dataKey={playerId}
                              position="outside"
                              content={({ x, y, value }) => {
                                const color =
                                  value <= 45 ? "#FF2F2F" : value >= 65 && value < 80 ? "#1CDA5C" : value >= 80 ? "#354BFE" : "#FFC516";
                                return (
                                  <>
                                    <rect x={x - 16} y={y - 10} width={32} height={20} fill={color} rx={4} />
                                    <text x={x} y={y} fill="white" fontSize={10} textAnchor="middle" alignmentBaseline="middle">
                                      {value}
                                    </text>
                                  </>
                                );
                              }}
                            />
                          )}
                        </Radar>
                        {radarPlayers.map((playerId, index) => (
                          <Radar
                            key={playerId}
                            name={radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Player"}
                            dataKey={playerId}
                            stroke={radarColors[(index + 1) % radarColors.length]}
                            strokeWidth={2}
                            fill={radarColors[(index + 1) % radarColors.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                    {radarPlayers.length > 0 && (
                      <div className="mt-4 w-full overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-900/50">
                            <tr>
                              <th className="p-2">Player</th>
                              {radarCategories.map((stat) => (
                                <th key={stat} className="p-2 text-center">{stat.slice(0, 3)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-gray-700">
                              <td className="p-2 flex items-center">
                                <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: radarColors[0] }}></span>
                                {playerName}
                              </td>
                              {radarCategories.map((stat) => (
                                <td key={stat} className="p-2 text-center">
                                  {(profile.player_grades[0]?.[stat] || 0).toFixed(1)}
                                </td>
                              ))}
                            </tr>
                            {radarPlayers.map((playerId, index) => (
                              <tr key={playerId} className="border-t border-gray-700">
                                <td className="p-2 flex items-center">
                                  <span
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: radarColors[(index + 1) % radarColors.length] }}
                                  ></span>
                                  {radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Loading..."}
                                </td>
                                {radarCategories.map((stat) => (
                                  <td key={stat} className="p-2 text-center">
                                    {(radarPlayerProfiles[playerId]?.player_grades[0]?.[stat] || 0).toFixed(1)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="p-4 rounded-xl border border-gray-700 shadow-md relative">
                <h2 className="text-lg font-semibold mb-3 text-orange-400 border-b border-orange-500 pb-2">Performance Trends</h2>
                <details className="mb-4">
                  <summary className="text-orange-400 text-sm cursor-pointer">Filters</summary>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input
                      type="number"
                      step="0.5"
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-center text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                      placeholder="Threshold"
                    />
                    <select
                      value={xGames}
                      onChange={(e) => setXGames(Number(e.target.value))}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    >
                      <option value="all">Season</option>
                      {[30, 20, 15, 10, 5].map((n) => (
                        <option key={n} value={n}>{n} games</option>
                      ))}
                    </select>
                    <select
                      value={opponent || ""}
                      onChange={(e) => setOpponent(e.target.value || null)}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    >
                      <option value="">All Opponents</option>
                      {["ATL", "BKN", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", "OKC", "ORL", "PHI", "PHX", "POR", "SAS", "SAC", "TOR", "UTA", "WAS"].map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                    <select
                      value={minutes || ""}
                      onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    >
                      <option value="">All Minutes</option>
                      {[10, 20, 25, 28, 30, 32, 34, 40].map((m) => (
                        <option key={m} value={m}>{m}+ Minutes</option>
                      ))}
                    </select>
                    <select
                      value={winLoss || ""}
                      onChange={(e) => setWinLoss(e.target.value || null)}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    >
                      <option value="">All Games</option>
                      <option value="W">Wins Only</option>
                      <option value="L">Losses Only</option>
                    </select>
                    <select
                      value={selectedTeammate || ""}
                      onChange={(e) => setSelectedTeammate(e.target.value || null)}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                    >
                      <option value="">Select Teammate</option>
                      {teammates.map((teammate) => (
                        <option key={teammate.player_id} value={teammate.player_id}>{teammate.player_name}</option>
                      ))}
                    </select>
                    {selectedTeammate && (
                      <select
                        value={filterTeammate || ""}
                        onChange={(e) => setFilterTeammate(e.target.value || null)}
                        className="bg-gray-900 border border-gray-700 rounded-xl p-2 text-sm focus:border-orange-500 focus:outline-none transition-all duration-300 hover:border-orange-500 shadow-md w-full"
                      >
                        <option value="">All Games</option>
                        <option value="with">With Teammate</option>
                        <option value="without">Without Teammate</option>
                      </select>
                    )}
                  </div>
                </details>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={filteredGames} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis dataKey="game_date" stroke="#fff" tick={{ fontSize: 8 }} />
                    <YAxis stroke="#fff" tick={{ fontSize: 8 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={selectedStat} radius={[6, 6, 0, 0]}>
                      {filteredGames.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry[selectedStat] < thresholdValue ? "#FF4747" : entry[selectedStat] > thresholdValue ? "#00DF4C" : "#8C8C89"}
                        />
                      ))}
                    </Bar>
                    <ReferenceLine y={thresholdValue} stroke="#fff" strokeDasharray="5 5" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-gray-400 mb-4">
                  Over {thresholdValue} {statCategories.find((stat) => stat.key === selectedStat)?.label || selectedStat} in {gamesOverThreshold} of {totalGames} games ({percentageOver}%)
                </div>
                <div className="flex flex-wrap justify-center gap-2 overflow-x-auto">
                  {statCategories.map((stat) => (
                    <button
                      key={stat.key}
                      onClick={() => setSelectedStat(stat.key)}
                      className={`px-2 py-1 rounded-xl font-medium text-xs transition-all duration-300 whitespace-nowrap ${
                        selectedStat === stat.key
                          ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md"
                          : "border border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                      }`}
                    >
                      {stat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === "gamelogs" && (
            <div className="p-4 rounded-xl border border-gray-700 shadow-md">
              <h2 className="text-lg font-semibold mb-3 text-orange-400 border-b border-orange-500 pb-2">Game Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[500px]">
                  <thead className="bg-gray-900/50">
                    <tr>
                      {["Date", "Matchup", "W/L", "Mins", "FG", "FG%", "3PT", "3PT%", "FT", "FT%", "Reb", "Ast", "Blk", "Stl", "PF", "Pts"].map((header) => (
                        <th key={header} className="p-2 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((game, index) => (
                      <tr key={index} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="p-2">{game.game_date}</td>
                        <td className="p-2">{game.matchup}</td>
                        <td className="p-2">{game.outcome}</td>
                        <td className="p-2">{game.mins_played}</td>
                        <td className="p-2">{game.fg_made}-{game.fg_att}</td>
                        <td className="p-2">{`${Math.round(game.fg_pct * 10000) / 100}%`}</td>
                        <td className="p-2">{game.fg3_made}-{game.fg3_att}</td>
                        <td className="p-2">{`${Math.round(game.fg3_pct * 10000) / 100}%`}</td>
                        <td className="p-2">{game.ft_made}-{game.ft_att}</td>
                        <td className="p-2">{`${Math.round(game.ft_pct * 10000) / 100}%`}</td>
                        <td className="p-2">{game.reb}</td>
                        <td className="p-2">{game.ast}</td>
                        <td className="p-2">{game.blk}</td>
                        <td className="p-2">{game.stl}</td>
                        <td className="p-2">{game.foul}</td>
                        <td className="p-2">{game.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastRow >= profile.gamelogs.length}
                  className="px-3 py-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm z-20 border-t border-gray-700 flex justify-around py-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "trends", label: "Trends" },
          { id: "gamelogs", label: "Game Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              selectedTab === tab.id ? "text-orange-400 border-t-2 border-orange-400" : "text-gray-400 hover:text-orange-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Profile;