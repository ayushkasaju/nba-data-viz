import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const NBA = () => {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/games`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        const data = await response.json();
        setGames(data);
      } catch (err) {
        console.error("Error fetching games:", err.message);
      }
    };
    fetchData();
  }, []);

  const handlePlayers = async (gameId) => {
    setLoadingPlayers(true);
    setSelectedGameId(gameId);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/games/${gameId}`, {
        method: "GET",
        redirect: "follow",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (response.ok) {
        const playerData = await response.json();
        setPlayers(playerData);
        ref.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error fetching player data:", err.message);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const getGameStatus = (game) => {
    return game[1];
  };

  const getGameStatusText = (game) => {
    const statusText = game[2];
    if (getGameStatus(game) === 1 && /\d{1,2}:\d{2}\s[ap]m\sET/i.test(statusText)) {
      // Use the full timestamp from game[9] which should be the actual start time
      const gameDate = new Date(game[9]);
      
      // Convert to user's local time
      return gameDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return statusText;
  };

  const getGameTime = (game) => {
    const date = new Date(game[9]);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTeamScores = (game) => {
    const awayScore = game[5] ?? "";
    const homeScore = game[8] ?? "";
    return `${awayScore} - ${homeScore}`;
  };

  const isGameLive = (game) => {
    return getGameStatus(game) === 2;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 sticky top-0 backdrop-blur-md z-10">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 animate-pulse">
              NBA Today
            </span>
          </h1>
          <div className="text-sm md:text-base font-medium text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full">
            {games.length} Games Today | {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Games Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          Today’s Matchups
        </h2>
        {games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <div
                key={game[0]}
                className={`group bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border 
                          ${selectedGameId === game[0] ? "border-cyan-400" : "border-gray-700"} 
                          hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-2 shadow-xl hover:shadow-2xl
                          flex flex-col`}
              >
                <div className="grid grid-cols-2 gap-2 items-center mb-4">
                  <div className="flex items-center gap-2">
                    {/* <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0" /> */}
                    <h2
                      className={`text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 ${
                        isGameLive(game) ? "truncate" : ""
                      }`}
                    >
                      {game[3]} @ {game[6]}
                    </h2>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isGameLive(game) && (
                      <span className="flex items-center gap-1 text-sm text-red-400 bg-red-900/50 px-2 py-1 rounded-full flex-shrink-0">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Live
                      </span>
                    )}
                    <span
                      className={`text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full ${
                        isGameLive(game) ? "truncate" : ""
                      }`}
                    >
                      {getGameStatusText(game)}
                    </span>
                  </div>
                </div>
                <div className="text-center flex-grow">
                  {/* <p className="text-gray-300 text-sm mb-2">{getGameTime(game)}</p> */}
                  {getGameStatus(game) !== 1 && getTeamScores(game) !== " - " && (
                    <p className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      {getTeamScores(game)}
                    </p>
                  )}
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => handlePlayers(game[0])}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                              text-white font-medium py-3 mt-4 rounded-lg transition-all duration-300 transform group-hover:scale-105 
                              flex items-center justify-center gap-2 shadow-md"
                    disabled={loadingPlayers && selectedGameId === game[0]}
                  >
                    {loadingPlayers && selectedGameId === game[0] ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      "View Players"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg py-12">No games scheduled today</p>
        )}
      </section>

      {/* Players Section */}
      {players.away && players.home && players.away.length > 0 && players.home.length > 0 && (
        <section className="container mx-auto px-4 py-12 backdrop-blur-md" ref={ref}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Game Rosters
            </h2>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 
                        text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md"
            >
              Back to Top
            </button>
          </div>

          {/* Away Team */}
          <div className="mb-12">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
              Away Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.away.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-800/80 backdrop-blur-md rounded-xl p-5 border border-gray-700 
                            hover:border-blue-400 transition-all duration-300 group shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-600 rounded-full" />
                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    {player.position} | {player.team_name} #{player.jersey_number}
                  </p>
                  <Link
                    to={`/nba/player/${player.id}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                              text-white text-center py-2 rounded-lg transition-all duration-300 group-hover:scale-105 shadow-md"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Home Team */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-500">
              Home Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.home.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-800/80 backdrop-blur-md rounded-xl p-5 border border-gray-700 
                            hover:border-blue-400 transition-all duration-300 group shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-600 rounded-full" />
                    <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    {player.position} | {player.team_name} #{player.jersey_number}
                  </p>
                  <Link
                    to={`/nba/player/${player.id}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                              text-white text-center py-2 rounded-lg transition-all duration-300 group-hover:scale-105 shadow-md"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default NBA;