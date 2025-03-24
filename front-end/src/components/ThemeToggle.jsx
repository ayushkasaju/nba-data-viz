import React, { useState, useEffect } from "react";

const ThemeToggle = () => {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", isLightMode);
  }, [isLightMode]);

  return (
    <button
      onClick={() => setIsLightMode(!isLightMode)}
      className="p-2 rounded-xl bg-gradient-to-br from-[var(--card-bg-from)] to-[var(--card-bg-to)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300"
    >
      <svg
        className="w-5 h-5 text-[var(--text-primary)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isLightMode ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        )}
      </svg>
    </button>
  );
};

export default ThemeToggle;