import React, { useState, useEffect } from "react";
import Typed from "react-typed";
import { Link } from "react-router-dom";

const Home = () => {
  const [typedStrings, setTypedStrings] = useState(["Loading..."]);
  const [leagueLeaders, setLeagueLeaders] = useState({
    points: [],
    rebounds: [],
    assists: [],
  });

  // Fetch data for Typed and League Leaders
  useEffect(() => {
    const fetchData = async () => {
      try {
        const playersResponse = await fetch(`${process.env.REACT_APP_API_URL}/players`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        const playersData = await playersResponse.json();

        const teamsResponse = await fetch(`${process.env.REACT_APP_API_URL}/teams`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        const teamsData = await teamsResponse.json();

        // Typed strings (unchanged)
        const playerNames = Object.values(playersData).flatMap(team =>
          team.players.map(player => player.player_name)
        );
        const teamNames = Object.values(teamsData).map(team => team.team_name);
        const allNames = [...playerNames, ...teamNames];
        const shuffledNames = allNames.sort(() => Math.random() - 0.5);
        const selectedNames = shuffledNames.slice(0, 10);
        setTypedStrings(allNames);

        // Extract league leaders
        const allPlayers = Object.values(playersData).flatMap(team => team.players);

        const topPoints = allPlayers
          .filter(player => player.points !== null)
          .sort((a, b) => b.points - a.points)
          .slice(0, 3);

        const topRebounds = allPlayers
          .filter(player => player.rebounds !== null)
          .sort((a, b) => b.rebounds - a.rebounds)
          .slice(0, 3);

        const topAssists = allPlayers
          .filter(player => player.assists !== null)
          .sort((a, b) => b.assists - a.assists)
          .slice(0, 3);

        setLeagueLeaders({
          points: topPoints,
          rebounds: topRebounds,
          assists: topAssists,
        });
      } catch (err) {
        console.error("Error fetching data:", err.message);
        setTypedStrings(["Error loading names"]);
        setLeagueLeaders({ points: [], rebounds: [], assists: [] });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiPjwvcmVjdD48L3N2Zz4=')] opacity-20" />

      {/* Main Content */}
      <div className="max-w-[1200px] w-full mx-auto text-center flex flex-col justify-center items-center px-6 py-16 z-10 relative">
        {/* Headline */}
        <h1 className="md:text-7xl sm:text-6xl text-4xl font-extrabold tracking-tight leading-none">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
            NBA Stats
          </span>
          <span className="block text-gray-100 mt-3 font-light tracking-wide">Become a Ball Knower</span>
        </h1>

        {/* Typed NBA Players and Teams */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-8">
          <p className="md:text-2xl sm:text-xl text-lg font-medium text-gray-300">Stats and Insights for</p>
          <Typed
            className="md:text-2xl sm:text-xl text-lg font-extrabold text-orange-400"
            strings={typedStrings}
            typeSpeed={40}
            backSpeed={60}
            loop
          />
        </div>

        {/* Subtext */}
        <p className="md:text-lg text-md font-light text-gray-400 max-w-lg mx-auto mt-6 leading-relaxed tracking-wide">
          Dive into NBA performance metrics. Elevate your basketball knowledge with real-time data.
        </p>

        {/* Call to Action */}
        <Link
          to="/players"
          className="mt-10 px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-extrabold text-xl rounded-xl 
                     shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Explore NBA Stats
        </Link>

        {/* League Leaders Section */}
        <div className="mt-20 w-full max-w-4xl">
          <h2 className="text-3xl font-extrabold text-orange-400 mb-8">League Leaders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Points Leaders */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white">Points</h3>
              {leagueLeaders.points.length > 0 ? (
                leagueLeaders.points.map((player, index) => (
                  <div
                    key={player.player_id}
                    className="relative bg-gradient-to-br from-gray-800 to-black p-4 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300"
                  >
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-orange-400 font-bold text-sm">{player.player_name}</p>
                    <p className="text-white mt-1">{player.points} PTS</p>
                    <p className="text-gray-400 text-xs">{player.team}</p>
                    <p className="text-gray-400 text-xs italic">{player.archetype}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Loading...</p>
              )}
            </div>

            {/* Rebounds Leaders */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white">Rebounds</h3>
              {leagueLeaders.rebounds.length > 0 ? (
                leagueLeaders.rebounds.map((player, index) => (
                  <div
                    key={player.player_id}
                    className="relative bg-gradient-to-br from-gray-800 to-black p-4 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300"
                  >
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-orange-400 font-bold text-sm">{player.player_name}</p>
                    <p className="text-white mt-1">{player.rebounds} REB</p>
                    <p className="text-gray-400 text-xs">{player.team}</p>
                    <p className="text-gray-400 text-xs italic">{player.archetype}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Loading...</p>
              )}
            </div>

            {/* Assists Leaders */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white">Assists</h3>
              {leagueLeaders.assists.length > 0 ? (
                leagueLeaders.assists.map((player, index) => (
                  <div
                    key={player.player_id}
                    className="relative bg-gradient-to-br from-gray-800 to-black p-4 rounded-xl border border-gray-700 hover:border-orange-500 transition-all duration-300"
                  >
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-orange-400 font-bold text-sm">{player.player_name}</p>
                    <p className="text-white mt-1">{player.assists} AST</p>
                    <p className="text-gray-400 text-xs">{player.team}</p>
                    <p className="text-gray-400 text-xs italic">{player.archetype}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Loading...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;