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
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LabelList,
} from "recharts";

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

  const { sport, playerId } = useParams();

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

  const radarCategories = [
    "Scoring",
    "Playmaking",
    "Rebounding",
    "Defense",
    "Athleticism"
  ];

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
        const allPlayersList = Object.values(data).flatMap(team => team.players);
        setAllPlayers(allPlayersList);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };
    fetchTeammates();
  }, [profile]);

  useEffect(() => {
    const fetchTeammateGamelogs = async () => {
      if (!selectedTeammate) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/${sport}/player/${selectedTeammate}`, {
          method: "GET",
          redirect: "follow",
          headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" },
        });
        const data = await response.json();
        setTeammateGamelogs(data.gamelogs);
      } catch (error) {
        console.error("Error fetching teammate gamelogs:", error);
      }
    };
    fetchTeammateGamelogs();
  }, [selectedTeammate, sport]);

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
      setRadarPlayerProfiles(prev => ({ ...prev, ...newRadarProfiles }));
    };
    if (radarPlayers.length > 0) {
      fetchRadarPlayerProfiles();
    }
  }, [radarPlayers, sport]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const game = payload[0]?.payload;
      const statLabel = statCategories.find(stat => stat.key === selectedStat)?.label || selectedStat;
      return (
        <div className="bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-700 text-white text-xs sm:text-sm">
          <span>{game?.game_date || "Date not available"}</span><br />
          <span>{game?.opp ? `vs. ${game.opp}` : "Opponent not available"}</span><br />
          {payload.map((ele, index) => (
            <div key={index}><span className="text-blue-300">{ele.value} {statLabel}</span></div>
          ))}
        </div>
      );
    }
    return null;
  };

  const radarData = radarCategories.map(stat => {
    const dataPoint = { stat };
    dataPoint[playerId] = Number((profile.player_grades[0]?.[stat] || 0).toFixed(1));
    radarPlayers.forEach(playerId => {
      const playerGrades = radarPlayerProfiles[playerId]?.player_grades[0];
      dataPoint[playerId] = Number((playerGrades?.[stat] || 0).toFixed(1));
    });
    return dataPoint;
  });

  const playerName = profile.player_info.length > 0 ? profile.player_info[0].PLAYER_FULL_NAME : "";
  const lastXGames = profile.gamelogs.slice(-xGames);
  const vsOpponent = opponent ? profile.gamelogs.filter((game) => game.opp === opponent) : profile.gamelogs;
  const reversedTableGames = [...profile.gamelogs].reverse();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reversedTableGames.slice(indexOfFirstRow, indexOfLastRow);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const radarColors = [
    "#00A8E8", // Main player
    "#FF6B6B", // First comparison
    "#4ECDC4", // Second comparison
    "#FFD93D", // Third comparison
    "#95E1D3", // Fourth comparison
  ];

  const filteredPlayers = allPlayers
    .filter(player => 
      player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      player.player_id !== playerId
    )
    .slice(0, 10);

  const handlePlayerSelect = (playerId) => {
    if (!radarPlayers.includes(playerId) && radarPlayers.length < 4) {
      setRadarPlayers([...radarPlayers, playerId]);
    }
    setSearchTerm("");
  };

  const removeRadarPlayer = (playerId) => {
    setRadarPlayers(radarPlayers.filter(id => id !== playerId));
  };

  // Calculate threshold stats
  const filteredGames = profile.gamelogs
    .filter((game) => {
      const isOpponentMatch = !opponent || game.opp === opponent;
      const isMinutesMatch = !minutes || game.mins_played >= minutes;
      const isWinLossMatch = !winLoss || game.outcome === winLoss;
      const isTeammateMatch = filterTeammate
        ? filterTeammate === "with"
          ? teammateGamelogs.some(tg => tg.game_id === game.game_id)
          : !teammateGamelogs.some(tg => tg.game_id === game.game_id)
        : true;
      return isOpponentMatch && isMinutesMatch && isWinLossMatch && isTeammateMatch;
    })
    .slice(-xGames);

  const gamesOverThreshold = filteredGames.filter(game => game[selectedStat] > thresholdValue).length;
  const totalGames = filteredGames.length;
  const percentageOver = totalGames > 0 ? ((gamesOverThreshold / totalGames) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {/* Bio and Radar Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {profile.player_info[0]?.PLAYER_IMAGE && (
                <div className="relative flex-shrink-0">
                  <img
                    src={profile.player_info[0].PLAYER_IMAGE}
                    alt={playerName}
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-blue-500 object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md -z-10 animate-pulse" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  {playerName}
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base"><span className="font-semibold text-blue-300">Team:</span> {profile.player_info[0]?.TEAM_FULL_NAME || "N/A"}</p>
                  <p className="text-sm sm:text-base"><span className="font-semibold text-blue-300">Position:</span> {profile.player_info[0]?.POSITION || "N/A"}</p>
                  <p className="text-sm sm:text-base"><span className="font-semibold text-blue-300">Height:</span> {profile.player_info[0]?.HEIGHT || "N/A"}</p>
                  <p className="text-sm sm:text-base"><span className="font-semibold text-blue-300">Weight:</span> {profile.player_info[0]?.WEIGHT || "N/A"}</p>
                  {profile.player_info[0]?.DRAFT_YEAR !== 0 && (
                    <p className="text-sm sm:text-base"><span className="font-semibold text-blue-300">Draft:</span> {profile.player_info[0]?.DRAFT_YEAR} Round {profile.player_info[0]?.DRAFT_ROUND} Pick {profile.player_info[0]?.DRAFT_NUMBER}</p>
                  )}
                  <p className="text-sm sm:text-base"><span className="font-semibold text-blue-300">Archetype:</span> {profile.player_grades[0]?.Archetype || "N/A"}</p>
                </div>
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  Season Averages
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {["PTS", "REB", "AST", "BLK", "STL", "TOV"].map(stat => (
                    <div key={stat} className="p-2 rounded-lg bg-gray-700/30 hover:bg-blue-500/20 transition-colors text-xs sm:text-sm">
                      <span className="font-semibold text-blue-300">{stat}:</span> {profile.player_grades[0]?.[stat] || "N/A"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {profile.player_grades[0] && (
            <div className="backdrop-blur-sm rounded-xl p-4 sm:p-6 flex flex-col items-center justify-start">
              <div className="w-full max-w-xs mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Compare players..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {searchTerm && (
                  <div className="absolute z-10 bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto w-full max-w-xs">
                    {filteredPlayers.map(player => (
                      <div
                        key={player.player_id}
                        onClick={() => handlePlayerSelect(player.player_id)}
                        className="p-2 hover:bg-gray-700 cursor-pointer text-sm"
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
                      className="flex items-center bg-gray-700/50 rounded-full px-2 py-1 text-xs"
                      style={{ border: `2px solid ${radarColors[(index + 1) % radarColors.length]}` }}
                    >
                      {radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Loading..."}
                      <button
                        onClick={() => removeRadarPlayer(playerId)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={radarPlayers.length > 0 ? 300 : 300} className="min-w-[200px]">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="70%" 
                  data={radarData}
                >
                  <PolarGrid stroke="#4B5563" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="none"/>
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
                          const color = value <= 45 ? "#FF4242" : value >= 65 && value < 80 ? "#35E16F" : value >= 80 ? "#4D66FF" : "#FFC822";
                          return (
                            <>
                              <rect x={x - 16} y={y - 10} width={32} height={20} fill={color} rx={4} />
                              <text x={x} y={y} fill="white" fontSize={12} textAnchor="middle" alignmentBaseline="middle">{value}</text>
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
                <div className="mt-4 w-full max-w-md">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="p-2">Player</th>
                        {radarCategories.map(stat => (
                          <th key={stat} className="p-2 text-center">{stat.slice(0, 3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-700">
                        <td className="p-2 flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: radarColors[0] }}></span>
                          {playerName}
                        </td>
                        {radarCategories.map(stat => (
                          <td key={stat} className="p-2 text-center">
                            {(profile.player_grades[0]?.[stat] || 0).toFixed(1)}
                          </td>
                        ))}
                      </tr>
                      {radarPlayers.map((playerId, index) => (
                        <tr key={playerId} className="border-t border-gray-700">
                          <td className="p-2 flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: radarColors[(index + 1) % radarColors.length] }}></span>
                            {radarPlayerProfiles[playerId]?.player_info[0]?.PLAYER_FULL_NAME || "Loading..."}
                          </td>
                          {radarCategories.map(stat => (
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
          )}
        </section>

        {/* Filters and Chart Section */}
        <section className="mb-8 sm:mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <input
                type="number"
                step="0.5"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-center text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
                placeholder="Threshold"
              />
              <select
                value={xGames}
                onChange={(e) => setXGames(Number(e.target.value))}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
              >
                <option value="all">Season</option>
                {[30, 20, 15, 10, 5].map(n => <option key={n} value={n}>{n} games</option>)}
              </select>
              <select
                value={opponent || ""}
                onChange={(e) => setOpponent(e.target.value || null)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
              >
                <option value="">All Opponents</option>
                {["ATL", "BKN", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", "OKC", "ORL", "PHI", "PHX", "POR", "SAS", "SAC", "TOR", "UTA", "WAS"].map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <select
                value={minutes || ""}
                onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
              >
                <option value="">All Minutes</option>
                {[10, 20, 25, 28, 30, 32, 34, 40].map(m => <option key={m} value={m}>{m}+ Minutes</option>)}
              </select>
              <select
                value={winLoss || ""}
                onChange={(e) => setWinLoss(e.target.value || null)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
              >
                <option value="">All Games</option>
                <option value="W">Wins Only</option>
                <option value="L">Losses Only</option>
              </select>
              <select
                value={selectedTeammate || ""}
                onChange={(e) => setSelectedTeammate(e.target.value || null)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
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
                  className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none w-full"
                >
                  <option value="">All Games</option>
                  <option value="with">With Teammate</option>
                  <option value="without">Without Teammate</option>
                </select>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
            {statCategories.map((stat) => (
              <button
                key={stat.key}
                onClick={() => setSelectedStat(stat.key)}
                className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                  selectedStat === stat.key
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {stat.label}
              </button>
            ))}
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
            <ResponsiveContainer width="100%" height={300} className="min-w-[300px]">
              <BarChart
                data={filteredGames}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="game_date" stroke="#fff" tick={{ fontSize: 10 }} />
                <YAxis stroke="#fff" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={selectedStat} radius={[6, 6, 0, 0]}>
                  {filteredGames.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry[selectedStat] < thresholdValue
                          ? "#FF4747"
                          : entry[selectedStat] > thresholdValue
                          ? "#00DF4C"
                          : "#8C8C89"
                      }
                    />
                  ))}
                </Bar>
                <ReferenceLine y={thresholdValue} stroke="#fff" strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-center mt-2 text-sm text-gray-300">
              Over {thresholdValue} {statCategories.find(stat => stat.key === selectedStat)?.label || selectedStat} in {gamesOverThreshold} of {totalGames} games ({percentageOver}%)
            </div>
          </div>
        </section>

        {/* Game Logs Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Game Logs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left min-w-[600px]">
              <thead className="bg-gray-700/50">
                <tr>
                  {["Date", "Matchup", "W/L", "Mins", "FG", "FG%", "3PT", "3PT%", "FT", "FT%", "Reb", "Ast", "Blk", "Stl", "PF", "Pts"].map((header) => (
                    <th key={header} className="p-2 sm:p-3 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((game, index) => (
                  <tr key={index} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                    <td className="p-2 sm:p-3">{game.game_date}</td>
                    <td className="p-2 sm:p-3">{game.matchup}</td>
                    <td className="p-2 sm:p-3">{game.outcome}</td>
                    <td className="p-2 sm:p-3">{game.mins_played}</td>
                    <td className="p-2 sm:p-3">{game.fg_made}-{game.fg_att}</td>
                    <td className="p-2 sm:p-3">{`${Math.round(game.fg_pct * 10000) / 100}%`}</td>
                    <td className="p-2 sm:p-3">{game.fg3_made}-{game.fg3_att}</td>
                    <td className="p-2 sm:p-3">{`${Math.round(game.fg3_pct * 10000) / 100}%`}</td>
                    <td className="p-2 sm:p-3">{game.ft_made}-{game.ft_att}</td>
                    <td className="p-2 sm:p-3">{`${Math.round(game.ft_pct * 10000) / 100}%`}</td>
                    <td className="p-2 sm:p-3">{game.reb}</td>
                    <td className="p-2 sm:p-3">{game.ast}</td>
                    <td className="p-2 sm:p-3">{game.blk}</td>
                    <td className="p-2 sm:p-3">{game.stl}</td>
                    <td className="p-2 sm:p-3">{game.foul}</td>
                    <td className="p-2 sm:p-3">{game.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg disabled:opacity-50 hover:from-blue-700 hover:to-cyan-600 transition-all text-sm sm:text-base"
            >
              Previous
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={indexOfLastRow >= profile.gamelogs.length}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg disabled:opacity-50 hover:from-blue-700 hover:to-cyan-600 transition-all text-sm sm:text-base"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;