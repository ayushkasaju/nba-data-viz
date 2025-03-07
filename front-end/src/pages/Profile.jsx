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
  Line,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LabelList
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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/nba/player/${playerId}`);
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };
    fetchData();
  }, [playerId]);

  useEffect (() => {
    const fetchTeammates = async () => {
      try {
        const response = await fetch("/players");
        const data = await response.json();
        const playerTeamId = profile.player_info[0]?.TEAM_ID;

        if (playerTeamId && data[playerTeamId]) {
          setTeammates(data[playerTeamId].players);
        }
      } catch (error) {
        console.error("Error fetching teammates:", error);
      }
    };

    fetchTeammates();
  }, [profile]);

  useEffect(() => {
    const fetchTeammateGamelogs = async () => {
      if (!selectedTeammate) return;
      try {
        const response = await fetch(`/${sport}/player/${selectedTeammate}`);
        const data = await response.json();
        setTeammateGamelogs(data.gamelogs);
      } catch (error) {
        console.error("Error fetching teammate gamelogs:", error);
      }
    };

    fetchTeammateGamelogs();
  }, [selectedTeammate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const game = payload[0]?.payload;
      const opponent = game?.opp;
      const gameDate = game?.game_date; 
  
      return (
        <div className="bg-white p-3">
          <span>{gameDate ? gameDate : 'Date not available'}</span>
          <br />
          <span>{opponent ? `vs. ${opponent}` : 'Opponent not available'}</span>
          <br />
          {payload.map((ele, index) => (
            <div key={index}>
              <span className="text-secondary">
                {ele.value} {ele.name}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const radarData = [
    { stat: "Scoring", value: (profile.player_grades[0]?.Scoring || 0).toFixed(1) },
    { stat: "Playmaking", value: (profile.player_grades[0]?.Playmaking || 0).toFixed(1) },
    { stat: "Rebounding", value: (profile.player_grades[0]?.Rebounding || 0).toFixed(1) },
    { stat: "Defense", value: (profile.player_grades[0]?.Defense || 0).toFixed(1) },
    { stat: "Athleticism", value: (profile.player_grades[0]?.Athleticism || 0).toFixed(1) },
  ];

  const playerName =
    profile.player_info.length > 0
      ? profile.player_info[0].PLAYER_FULL_NAME
      : "";

  const lastXGames = profile.gamelogs.slice(-xGames);

  const vsOpponent = opponent ? profile.gamelogs.filter((game) => game.opp === opponent) : profile.gamelogs;

  const reversedTableGames = [...profile.gamelogs].reverse();

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reversedTableGames.slice(indexOfFirstRow, indexOfLastRow);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bio Section */}
        <div className="text-white p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Player Image */}
            {profile.player_info[0]?.PLAYER_IMAGE && (
              <div className="flex-shrink-0 relative">
                <img
                  src={profile.player_info[0].PLAYER_IMAGE}
                  alt={profile.player_info[0].PLAYER_FULL_NAME}
                  className="w-32 h-32 rounded-full border-4 border-gradient-to-r from-blue-500 to-purple-500 object-cover transform hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-md -z-10 animate-pulse"></div>
              </div>
            )}
            
            {/* Player Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-center md:text-left bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {playerName}
              </h1>
              
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center">
                  <span className="font-semibold text-blue-300 mr-2">Team:</span> 
                  <span className="text-gray-100">{profile.player_info[0]?.TEAM_FULL_NAME || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-blue-300 mr-2">Position:</span> 
                  <span className="text-gray-100">{profile.player_info[0]?.POSITION || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-blue-300 mr-2">Height:</span> 
                  <span className="text-gray-100">{profile.player_info[0]?.HEIGHT || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-blue-300 mr-2">Weight:</span> 
                  <span className="text-gray-100">{profile.player_info[0]?.WEIGHT || "N/A"}</span>
                </div>
                {profile.player_info[0]?.DRAFT_YEAR !== 0 ? <div className="flex items-center">
                  <span className="font-semibold text-blue-300 mr-2">Draft:</span> 
                  <span className="text-gray-100">{profile.player_info[0]?.DRAFT_YEAR || "N/A"} Round {profile.player_info[0]?.DRAFT_ROUND || "N/A"} Pick {profile.player_info[0]?.DRAFT_NUMBER || "N/A"}</span>
                </div> : <></>}
              </div>

              {/* Stats Grid */}
              <h2 className="text-lg font-semibold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Season Averages
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="relative p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-semibold text-blue-300">PTS:</span> 
                  <span className="ml-1 text-white">{profile.player_grades[0]?.PTS || "N/A"}</span>
                  <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none"></div>
                </div>
                <div className="relative p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-semibold text-blue-300">REB:</span> 
                  <span className="ml-1 text-white">{profile.player_grades[0]?.REB || "N/A"}</span>
                  <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none"></div>
                </div>
                <div className="relative p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-semibold text-blue-300">AST:</span> 
                  <span className="ml-1 text-white">{profile.player_grades[0]?.AST || "N/A"}</span>
                  <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none"></div>
                </div>
                <div className="relative p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-semibold text-blue-300">BLK:</span> 
                  <span className="ml-1 text-white">{profile.player_grades[0]?.BLK || "N/A"}</span>
                  <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none"></div>
                </div>
                <div className="relative p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-semibold text-blue-300">STL:</span> 
                  <span className="ml-1 text-white">{profile.player_grades[0]?.STL || "N/A"}</span>
                  <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none"></div>
                </div>
                <div className="relative p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <span className="font-semibold text-blue-300">TOV:</span> 
                  <span className="ml-1 text-white">{profile.player_grades[0]?.TOV || "N/A"}</span>
                  <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart Section */}
        {profile.player_grades[0] ? (
          <div className="flex justify-center items-center">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="stat" tick={{ fill: "white" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false}/>
                <Radar name={playerName} dataKey="value" stroke="#007ea7" strokeWidth={2} fill="#007ea7" fillOpacity={0.4}>
                  <LabelList
                    dataKey="value"
                    position="outside"
                    content={({ x, y, value }) => {
                      const color = value <= 45 ? "#ff4242" : value >= 65 && value < 80 ? "#35e16f" : value >= 80 ? "#4D66FF" : "#ffc822";
                      const padding = 3;

                      return (
                        <>
                          {/* Background rectangle */}
                          <rect
                            x={x - 18 - padding} // Position the rect with some padding around the text
                            y={y - 9 - padding}
                            width={36 + padding * 2}  // Width based on the text length
                            height={18 + padding * 2} // Height based on the text size
                            fill={color}
                            rx={5}
                          />
                          
                          {/* Text inside the rectangle */}
                          <text x={x} y={y} fill="white" fontSize={16} textAnchor="middle" alignmentBaseline="middle">
                            {value}
                          </text>
                        </>
                      );
                    }}
                    fontSize={16}
                    angle={0}
                  />
                </Radar>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : ( <></> )}
      </div>
                
        {/* Chart Section */}
        <div className="w-full">
          <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={profile.gamelogs
              .filter((game) => {
                const isOpponentMatch = !opponent || game.opp === opponent;
                const isMinutesMatch = !minutes || game.mins_played >= minutes;
                const isWinLossMatch = !winLoss || game.outcome === winLoss;
                const isTeammateMatch = filterTeammate
                  ? filterTeammate === 'with'
                    ? teammateGamelogs.some(teammateGame => teammateGame.game_id === game.game_id)
                    : !teammateGamelogs.some(teammateGame => teammateGame.game_id === game.game_id)
                  : true;
        
                return isOpponentMatch && isMinutesMatch && isWinLossMatch && isTeammateMatch;
              })
              .slice(-xGames)
            }
            margin={{ top: 0, right: 50, left: 0, bottom: 5 }}
          >
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip active={false} payload={[]} label={""} opponent={opponent} />} />
              <Bar dataKey={selectedStat} radius={20}>
                {profile.gamelogs.filter((game) => {
                  const isOpponentMatch = !opponent || game.opp === opponent;
                  const isMinutesMatch = !minutes || game.mins_played >= minutes;
                  const isWinLossMatch = !winLoss || game.outcome === winLoss;
                  const isTeammateMatch = filterTeammate
                    ? filterTeammate === 'with'
                      ? teammateGamelogs.some(teammateGame => teammateGame.game_id === game.game_id)
                      : !teammateGamelogs.some(teammateGame => teammateGame.game_id === game.game_id)
                    : true;
          
                  return isOpponentMatch && isMinutesMatch && isWinLossMatch && isTeammateMatch;
                })
                .slice(-xGames).map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry[selectedStat] < thresholdValue ? "#FF4747" : entry[selectedStat] > thresholdValue ? "#00DF4C" : "#8C8C89"
                    }
                  />
                ))}
              </Bar>
              <ReferenceLine y={thresholdValue} stroke="white" />
              <Line type="monotone" dataKey="thresholdLine" stroke="#000000" dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Stat Category Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            {statCategories.map((stat) => (
              <button
                key={stat.key}
                className={`px-3 py-1 rounded-lg font-medium text-white ${
                  selectedStat === stat.key ? "bg-[#007ea7]" : "bg-gray-700"
                }`}
                onClick={() => setSelectedStat(stat.key)}
              >
                {stat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid md:grid-cols-6 gap-3">
          <input
            className="rounded-2xl bg-[#007ea7] text-white p-1 text-center mx-3 my-1"
            type="number"
            step="0.5"
            id="thresholdValue"
            value={thresholdValue}
            onChange={(e) => setThresholdValue(parseFloat(e.target.value, 10))}
          />
          <select
            className="rounded-2xl bg-[#007ea7] text-white text-center p-1 mx-3 my-1"
            id="xGames"
            onChange={(e) => setXGames(Number(e.target.value))}
            value={xGames}
          >
            <option value="all">Season</option>
            <option value={30}>30 games</option>
            <option value={20}>20 games</option>
            <option value={15}>15 games</option>
            <option value={10}>10 games</option>
            <option value={5}>5 games</option>
          </select> 
          <select
            className="rounded-2xl bg-[#007ea7] text-white p-1 mx-3 my-1 text-center"
            id="opponent"
            onChange={(e) => setOpponent(e.target.value)}
            value={opponent}
          >
            <option value="">All Opponents</option>
            <option value="ATL">ATL</option>
            <option value="BKN">BKN</option>
            <option value="BOS">BOS</option>
            <option value="CHA">CHA</option>
            <option value="CHI">CHI</option>
            <option value="CLE">CLE</option>
            <option value="DAL">DAL</option>
            <option value="DEN">DEN</option>
            <option value="DET">DET</option>
            <option value="GSW">GSW</option>
            <option value="HOU">HOU</option>
            <option value="IND">IND</option>
            <option value="LAC">LAC</option>
            <option value="LAL">LAL</option>
            <option value="MEM">MEM</option>
            <option value="MIA">MIA</option>
            <option value="MIL">MIL</option>
            <option value="MIN">MIN</option>
            <option value="NOP">NOP</option>
            <option value="NYK">NYK</option>
            <option value="OKC">OKC</option>
            <option value="ORL">ORL</option>
            <option value="PHI">PHI</option>
            <option value="PHX">PHX</option>
            <option value="POR">POR</option>
            <option value="SAS">SAS</option>
            <option value="SAC">SAC</option>
            <option value="TOR">TOR</option>
            <option value="UTA">UTA</option>
            <option value="WAS">WAS</option>
          </select>
          <select
            className="rounded-2xl bg-[#007ea7] text-white p-1 mx-3 my-1 text-center"
            id="minutesPlayed"
            onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
            value={minutes}
          >
            <option value="">All Minutes</option>
            <option value="10">10+ Minutes</option>
            <option value="20">20+ Minutes</option>
            <option value="25">24+ Minutes</option>
            <option value="28">28+ Minutes</option>
            <option value="30">30+ Minutes</option>
            <option value="32">32+ Minutes</option>
            <option value="34">34+ Minutes</option>
            <option value="40">40+ Minutes</option>
          </select>
          <select
            className="rounded-2xl bg-[#007ea7] text-white p-1 mx-3 my-1 text-center"
            id="winLoss"
            onChange={(e) => setWinLoss(e.target.value || null)}
            value={winLoss || ""}
          >
            <option value="">All Games</option>
            <option value="W">Wins Only</option>
            <option value="L">Losses Only</option>
          </select>
          <select
            className="rounded-2xl bg-[#007ea7] text-white p-1 mx-3 my-1 text-center"
            id="selectedTeammate"
            onChange={(e) => setSelectedTeammate(e.target.value)}
            value={selectedTeammate || ""}
          >
            <option value="">Select a teammate</option>
            {teammates.map((teammate) => (
              <option key={teammate.player_id} value={teammate.player_id}>
                {teammate.player_name}
              </option>
            ))}
          </select>

          {selectedTeammate && (
            <>
              <select
                className="rounded-2xl bg-[#007ea7] text-white p-1 mx-3 my-1 text-center"
                id="filterTeammate"
                onChange={(e) => setFilterTeammate(e.target.value)}
                value={filterTeammate || ""}
              >
                <option value="">All games</option>
                <option value="with">With selected teammate</option>
                <option value="without">Without selected teammate</option>
              </select>
            </>
          )}
        </div>

        {/* Game Log Section */}
        <div className="mt-6 text-white">
          <h2 className="text-xl md:text-2xl mb-4">All Gamelogs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Matchup</th>
                  <th className="p-2">W/L</th>
                  <th className="p-2">Mins</th>
                  <th className="p-2">FG</th>
                  <th className="p-2">FG%</th>
                  <th className="p-2">3PT</th>
                  <th className="p-2">3PT%</th>
                  <th className="p-2">FT</th>
                  <th className="p-2">FT%</th>
                  <th className="p-2">Reb</th>
                  <th className="p-2">Ast</th>
                  <th className="p-2">Blk</th>
                  <th className="p-2">Stl</th>
                  <th className="p-2">PF</th>
                  <th className="p-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((game, index) => (
                  <tr key={index} className="border-b border-gray-700">
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
              className="bg-[#007ea7] w-20 rounded-md text-sm py-2 text-white disabled:opacity-50"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="bg-[#007ea7] w-20 rounded-md text-sm py-2 text-white disabled:opacity-50"
              onClick={() => paginate(currentPage + 1)}
              disabled={indexOfLastRow >= profile.gamelogs.length}
            >
              Next
            </button>
          </div>
        </div>
    </>
  );
};

export default Profile;