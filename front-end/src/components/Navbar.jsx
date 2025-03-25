import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const importLogo = (teamId) => {
  try {
    return require(`../assets/logos/${teamId}.png`);
  } catch (err) {
    console.warn(`Logo not found for team ID: ${teamId}`);
    return null
  }
};

const importHeadshot = (playerId) => {
  try {
    return require(`../assets/headshots/${playerId}.png`);
  } catch (err) {
    console.warn(`Headshot not found for player ID: ${playerId}`);
    return null
  }
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ players: [], teams: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchSearchResults();
    } else {
      setSearchResults({ players: [], teams: [] });
    }
  }, [searchQuery]);

  const fetchSearchResults = async () => {
    try {
      const [playersResponse, teamsResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/players`, {
            method: "GET",
            redirect: "follow",
            headers: {
              "Accept": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }),
        fetch(`${process.env.REACT_APP_API_URL}/teams`, {
            method: "GET",
            redirect: "follow",
            headers: {
              "Accept": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          })
      ]);
      
      const playersData = await playersResponse.json();
      const teamsData = await teamsResponse.json();

      // Filter and enhance players with headshots
      const filteredPlayers = Object.values(playersData)
        .flatMap(team => 
          team.players.filter(player => 
            player.player_name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map(player => ({
            ...player,
            headshot: importHeadshot(player.player_id)
          }))
        )
        .slice(0, 5);

      // Filter and enhance teams with logos
      const filteredTeams = Object.values(teamsData)
        .filter(team => 
            team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(team => {
            console.log("Team:", team);
            return {
            ...team,
            logo: importLogo(team.team_id)
            };
        })
        .slice(0, 5);

      setSearchResults({
        players: filteredPlayers,
        teams: filteredTeams
      });
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/95 backdrop-blur-md z-30 border-b border-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 tracking-tight"
          onClick={() => setSearchQuery("")}
        >
          STATS.
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          <NavLink
            to="/games"
            className={({ isActive }) =>
              `text-white font-bold px-5 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-md"
                  : "hover:bg-gray-800 hover:shadow-md"
              }`
            }
          >
            Games
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) =>
              `text-white font-bold px-5 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-md"
                  : "hover:bg-gray-800 hover:shadow-md"
              }`
            }
          >
            Teams
          </NavLink>
          <NavLink
            to="/players"
            className={({ isActive }) =>
              `text-white font-bold px-5 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-md"
                  : "hover:bg-gray-800 hover:shadow-md"
              }`
            }
          >
            Players
          </NavLink>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex relative items-center">
          <input
            type="text"
            placeholder="Search players or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 text-white px-4 py-2 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {searchQuery.length > 2 && (
            <div className="absolute top-full mt-2 right-0 w-96 bg-gray-900 rounded-lg shadow-lg max-h-96 overflow-y-auto z-40">
              {searchResults.players.map(player => (
                <Link
                  key={player.player_id}
                  to={`/nba/player/${player.player_id}`}
                  className="flex items-center p-2 hover:bg-gray-800"
                  onClick={() => setSearchQuery("")}
                >
                  <img
                    src={player.headshot}
                    alt={player.player_name}
                    className="w-8 h-8 rounded-full object-cover mr-3"
                  />
                  <span className="text-white">{player.player_name} - {player.team}</span>
                </Link>
              ))}
              {searchResults.teams.map(team => (
                <Link
                  key={team.team_id}
                  to={`/team/${team.team_id}`}
                  className="flex items-center p-2 hover:bg-gray-800"
                  onClick={() => setSearchQuery("")}
                >
                  <img
                    src={team.logo}
                    alt={team.team_name}
                    className="w-8 h-8 rounded-full object-cover mr-3"  
                  />
                  <span className="text-white">{team.team_name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu Button and Search Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button
            className="text-white hover:text-orange-400 transition-colors duration-300"
            onClick={toggleSearch}
            aria-label="Toggle search"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            className="text-white hover:text-orange-400 transition-colors duration-300"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="w-full md:hidden mt-4">
            <input
              type="text"
              placeholder="Search players or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchQuery.length > 2 && (
              <div className="mt-2 bg-gray-900 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.players.map(player => (
                  <Link
                    key={player.player_id}
                    to={`/nba/player/${player.player_id}`}
                    className="flex items-center p-2 hover:bg-gray-800"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                  >
                    <img
                      src={player.headshot}
                      alt={player.player_name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="text-white text-sm">{player.player_name} - {player.team}</span>
                  </Link>
                ))}
                {searchResults.teams.map(team => (
                  <Link
                    key={team.team_id}
                    to={`/team/${team.team_id}`}
                    className="flex items-center p-2 hover:bg-gray-800"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                  >
                    <img
                      src={team.logo}
                      alt={team.team_name}
                      className="w-8 h-8 mr-2"
                    />
                    <span className="text-white text-sm">{team.team_name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        <div
          className={`${
            isOpen ? "block" : "hidden"
          } md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-md border-t border-gray-800 shadow-md`}
        >
          <div className="flex flex-col items-center gap-4 py-6">
            <NavLink
              to="/games"
              className={({ isActive }) =>
                `text-white font-bold px-5 py-2 w-3/4 text-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-md"
                    : "hover:bg-gray-800 hover:shadow-md"
                }`
              }
              onClick={toggleMenu}
            >
              Games
            </NavLink>
            <NavLink
              to="/teams"
              className={({ isActive }) =>
                `text-white font-bold px-5 py-2 w-3/4 text-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-md"
                    : "hover:bg-gray-800 hover:shadow-md"
                }`
              }
              onClick={toggleMenu}
            >
              Teams
            </NavLink>
            <NavLink
              to="/players"
              className={({ isActive }) =>
                `text-white font-bold px-5 py-2 w-3/4 text-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-md"
                    : "hover:bg-gray-800 hover:shadow-md"
                }`
              }
              onClick={toggleMenu}
            >
              Players
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;