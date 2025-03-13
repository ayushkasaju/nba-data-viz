import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu toggle

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-md z-20 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400"
        >
          LOGO.
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink
            to="/games"
            className={({ isActive }) =>
              `text-white font-medium px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                  : "hover:bg-gray-700/50"
              }`
            }
          >
            Today
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) =>
              `text-white font-medium px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                  : "hover:bg-gray-700/50"
              }`
            }
          >
            Teams
          </NavLink>
          <NavLink
            to="/players"
            className={({ isActive }) =>
              `text-white font-medium px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                  : "hover:bg-gray-700/50"
              }`
            }
          >
            Players
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
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
          } md:hidden absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-lg transition-all duration-300`}
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <NavLink
              to="/games"
              className={({ isActive }) =>
                `text-white font-medium px-3 py-2 w-full text-center rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                    : "hover:bg-gray-700/50"
                }`
              }
              onClick={toggleMenu}
            >
              Today
            </NavLink>
            <NavLink
              to="/teams"
              className={({ isActive }) =>
                `text-white font-medium px-3 py-2 w-full text-center rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                    : "hover:bg-gray-700/50"
                }`
              }
              onClick={toggleMenu}
            >
              Teams
            </NavLink>
            <NavLink
              to="/players"
              className={({ isActive }) =>
                `text-white font-medium px-3 py-2 w-full text-center rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                    : "hover:bg-gray-700/50"
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