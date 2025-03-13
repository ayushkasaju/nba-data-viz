import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const NBA = () => {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null); // Track selected game
  const [loadingPlayers, setLoadingPlayers] = useState(false); // Loading state for players
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
    // Assuming game[4] or another index might hold status or time data in the future
    return game[1]; // Placeholder; enhance with real data if available
  };

  const getGameTime = (game) => {
    const date = new Date(game[6]); // Index 6 is the UTC game time
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-8 sticky top-0 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 animate-pulse">
              NBA Today
            </span>
          </h1>
          <div className="text-sm md:text-base font-medium text-gray-300">
            {games.length} Games Today | {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Games Section */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          Today’s Matchups
        </h2>
        {games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game[0]}
                className={`group bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border 
                          ${selectedGameId === game[0] ? "border-cyan-400" : "border-gray-700"} 
                          hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-2 shadow-lg`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    <span className="text-blue-400">{game[2]}</span> @{" "}
                    <span className="text-cyan-300">{game[4]}</span>
                  </h2>
                  <span className="text-sm text-gray-400">{getGameStatus(game)}</span>
                </div>
                <div className="text-center text-gray-300 mb-4">
                  {/* Placeholder for game time or odds if available in data */}
                  <p>{getGameTime(game)}</p>
                </div>
                <button
                  onClick={() => handlePlayers(game[0])}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                            text-white font-medium py-3 rounded-lg transition-all duration-300 transform group-hover:scale-105 
                            flex items-center justify-center gap-2"
                  disabled={loadingPlayers && selectedGameId === game[0]}
                >
                  {loadingPlayers && selectedGameId === game[0] ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg">No games scheduled today</p>
        )}
      </section>

      {/* Players Section */}
      {players.away && players.home && players.away.length > 0 && players.home.length > 0 && (
        <section className="container mx-auto px-4 py-12 bg-gray-900/50" ref={ref}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Game Rosters
            </h2>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-gray-700/50 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-all duration-300"
            >
              Back to Top
            </button>
          </div>

          {/* Away Team */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Away Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.away.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-800/70 backdrop-blur-md rounded-xl p-5 border border-gray-700 
                            hover:border-blue-400 transition-all duration-300 group shadow-md"
                >
                  <h4 className="text-lg font-semibold text-white mb-2">{player.name}</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    {player.position} | {player.team_name} #{player.jersey_number}
                  </p>
                  <Link
                    to={`/nba/player/${player.id}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                              text-white text-center py-2 rounded-lg transition-all duration-300 group-hover:scale-105"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Home Team */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-cyan-300">Home Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.home.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-800/70 backdrop-blur-md rounded-xl p-5 border border-gray-700 
                            hover:border-blue-400 transition-all duration-300 group shadow-md"
                >
                  <h4 className="text-lg font-semibold text-white mb-2">{player.name}</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    {player.position} | {player.team_name} #{player.jersey_number}
                  </p>
                  <Link
                    to={`/nba/player/${player.id}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 
                              text-white text-center py-2 rounded-lg transition-all duration-300 group-hover:scale-105"
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