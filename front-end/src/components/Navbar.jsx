import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/95 backdrop-blur-md z-30 border-b border-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 tracking-tight"
        >
          STATS.
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none hover:text-orange-400 transition-colors duration-300"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

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