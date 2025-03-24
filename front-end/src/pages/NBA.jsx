import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const NBA = () => {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState({ away: [], home: [] });
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

  const fetchPlayerGrades = async (playerId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/nba/player/${playerId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.player_grades[0];
      }
    } catch (err) {
      console.error(`Error fetching grades for player ${playerId}:`, err.message);
      return null;
    }
  };

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

        const awayWithGrades = await Promise.all(
          playerData.away.map(async (player) => {
            const grades = await fetchPlayerGrades(player.id);
            return { ...player, grades };
          })
        );

        const homeWithGrades = await Promise.all(
          playerData.home.map(async (player) => {
            const grades = await fetchPlayerGrades(player.id);
            return { ...player, grades };
          })
        );

        setPlayers({
          away: awayWithGrades,
          home: homeWithGrades,
        });
        ref.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error fetching player data:", err.message);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const getGameStatus = (game) => game[1];
  const getGameStatusText = (game) => {
    const statusText = game[2];
    if (getGameStatus(game) === 1 && /\d{1,2}:\d{2}\s[ap]m\sET/i.test(statusText)) {
      const gameDate = new Date(game[9]);
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
  const getTeamScores = (game) => `${game[5] ?? ""} - ${game[8] ?? ""}`;
  const isGameLive = (game) => getGameStatus(game) === 2;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiPjwvcmVjdD48L3N2Zz4=')] opacity-20" />

      {/* Header */}
      <header className="container mx-auto px-4 pt-8 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="md:text-6xl sm:text-5xl text-3xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
              NBA Today
            </span>
          </h1>
          <div className="text-sm md:text-base font-semibold text-gray-300 bg-gray-900/80 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {games.length} Games Today | {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Games Section */}
      <section className="container mx-auto px-4 py-12 z-10 relative">
        <h2 className="md:text-3xl sm:text-2xl text-xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
          Today’s Matchups
        </h2>
        {games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game[0]}
                className={`relative bg-gradient-to-br from-gray-800 to-black p-6 rounded-xl border border-gray-700 hover:border-orange-500 
                          transition-all duration-300 shadow-md ${
                            selectedGameId === game[0] ? "border-orange-500" : ""
                          }`}
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-orange-500 rounded-full" />
                <div className="grid grid-cols-2 gap-2 items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">
                      {game[3]} @ {game[6]}
                    </h2>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isGameLive(game) && (
                      <span className="flex items-center gap-1 text-sm text-orange-400 bg-orange-900/30 px-2 py-1 rounded-xl">
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                        Live
                      </span>
                    )}
                    <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded-xl">
                      {getGameStatusText(game)}
                    </span>
                  </div>
                </div>
                {/* <div className="text-center flex-grow">
                  {getGameStatus(game) !== 1 && getTeamScores(game) !== " - " && (
                    <p className="text-2xl font-extrabold text-white">{getTeamScores(game)}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">{getGameTime(game)}</p>
                </div> */}
                <button
                  onClick={() => handlePlayers(game[0])}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl 
                            shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingPlayers && selectedGameId === game[0]}
                >
                  {loadingPlayers && selectedGameId === game[0] ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white inline mr-2" viewBox="0 0 24 24">
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
          <p className="text-center text-gray-400 text-lg py-12 font-medium">No games scheduled today</p>
        )}
      </section>

      {/* Players Section */}
      {players.away.length > 0 && players.home.length > 0 && (
        <section className="container mx-auto px-4 py-12 z-10 relative" ref={ref}>
          <h2 className="md:text-3xl sm:text-2xl text-xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
            Game Rosters
          </h2>

          {/* Away Team */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="md:text-2xl sm:text-xl text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Away Team
              </h3>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-4 py-2 bg-gradient-to-br from-gray-800 to-black text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                Back to Top
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...players.away]
                .sort((a, b) => (b.grades?.Scoring || 0) - (a.grades?.Scoring || 0))
                .map((player) => (
                  <div
                    key={player.id}
                    className="relative bg-gradient-to-br from-gray-800 to-black p-5 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300 shadow-md"
                  >
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-md" />
                      <h4 className="text-lg font-bold text-white">{player.name}</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 font-medium">
                      {player.position} | {player.team_name} #{player.jersey_number}
                    </p>
                    <Link
                      to={`/nba/player/${player.id}`}
                      className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
            </div>
          </div>

          {/* Home Team */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="md:text-2xl sm:text-xl text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Home Team
              </h3>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-4 py-2 bg-gradient-to-br from-gray-800 to-black text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                Back to Top
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...players.home]
                .sort((a, b) => (b.grades?.Scoring || 0) - (a.grades?.Scoring || 0))
                .map((player) => (
                  <div
                    key={player.id}
                    className="relative bg-gradient-to-br from-gray-800 to-black p-5 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300 shadow-md"
                  >
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-md" />
                      <h4 className="text-lg font-bold text-white">{player.name}</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 font-medium">
                      {player.position} | {player.team_name} #{player.jersey_number}
                    </p>
                    <Link
                      to={`/nba/player/${player.id}`}
                      className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center"
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