import React, { useState, useEffect } from "react";
import Typed from "react-typed";
import { Link } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const [stats, setStats] = useState({ nba: 0, nfl: 0, ufc: 0 }); // Placeholder for dynamic stats

  useEffect(() => {
    // Simulate fetching stats (replace with real API call if available)
    const fetchStats = async () => {
      // Example: const response = await axios.get(`${process.env.REACT_APP_API_URL}/stats`);
      setTimeout(() => {
        setStats({ nba: 1234, nfl: 987, ufc: 456 }); // Mock data
      }, 1000);
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,126,167,0.2)_0%,_transparent_70%)] z-0 animate-pulse-slow" />
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 z-0" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 z-0" />

      {/* Main Content */}
      <div className="max-w-[900px] w-full mx-auto text-center flex flex-col justify-center items-center px-4 py-12 z-10">
        <p className="text-[#00A8E8] font-bold text-lg md:text-xl uppercase tracking-wider animate-bounce">
          Getting Yo Money Up
        </p>
        <h1 className="md:text-7xl sm:text-6xl text-4xl font-extrabold md:py-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 animate-gradient">
          Get Yo Money Up.
        </h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-4 py-4">
          <p className="md:text-5xl sm:text-4xl text-xl font-bold">Statistics and insights for</p>
          <Typed
            className="md:text-5xl sm:text-4xl text-xl font-bold text-cyan-300"
            strings={["NBA", "NFL", "UFC"]}
            typeSpeed={120}
            backSpeed={140}
            loop
          />
        </div>
        <p className="md:text-2xl text-lg font-semibold text-gray-300 max-w-lg mx-auto mt-4">
          Proceed to the dropdown to get started!
        </p>

        {/* Call to Action */}
        <Link
          to="/nba" // Assuming NBA as the starting point; adjust as needed
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium 
                    w-[200px] rounded-lg py-3 mt-8 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Get Started
        </Link>

        {/* Stats Section
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700 hover:border-blue-400 transition-all duration-300">
            <p className="text-blue-400 font-semibold">NBA Players</p>
            <p className="text-2xl font-bold text-white">{stats.nba.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700 hover:border-blue-400 transition-all duration-300">
            <p className="text-blue-400 font-semibold">NFL Players</p>
            <p className="text-2xl font-bold text-white">{stats.nfl.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700 hover:border-blue-400 transition-all duration-300">
            <p className="text-blue-400 font-semibold">UFC Fighters</p>
            <p className="text-2xl font-bold text-white">{stats.ufc.toLocaleString()}</p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Home;