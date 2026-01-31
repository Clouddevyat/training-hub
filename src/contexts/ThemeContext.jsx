import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Create the context
const ThemeContext = createContext(null);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Persist dark mode preference
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('trainingHub_darkMode');
      return saved !== null ? JSON.parse(saved) : true; // Default to dark mode
    } catch {
      return true;
    }
  });

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem('trainingHub_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Memoized theme object - recalculates only when darkMode changes
  const theme = useMemo(() => ({
    // Backgrounds
    bg: darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-100 to-slate-200',
    card: darkMode ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50',
    cardAlt: darkMode ? 'bg-gray-700/80' : 'bg-slate-50/80',
    cardHover: 'card-hover',

    // Text
    text: darkMode ? 'text-gray-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-gray-300' : 'text-slate-500',
    textSubtle: darkMode ? 'text-gray-400' : 'text-slate-400',
    textDisabled: darkMode ? 'text-gray-500' : 'text-slate-400',

    // Borders
    border: darkMode ? 'border-gray-700/50' : 'border-slate-200/50',

    // Inputs
    input: darkMode
      ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/50'
      : 'bg-white/90 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50',

    // Layout
    header: darkMode ? 'glass-dark' : 'bg-gradient-to-r from-slate-800 to-slate-900',
    nav: darkMode ? 'glass-dark' : 'bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-lg shadow-slate-200/20',
    modal: darkMode ? 'bg-gray-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl shadow-2xl',
    modalBackdrop: 'modal-backdrop',

    // Effects
    glass: darkMode ? 'glass-dark' : 'glass-light',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-600',
    gradientText: 'gradient-text',

    // Buttons
    btnDisabled: darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-200 text-slate-400',
    btnSecondary: darkMode ? 'bg-gray-600/60 hover:bg-gray-500/60 text-gray-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnGhost: darkMode ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-slate-100 text-slate-600',

    // Chips and badges
    chip: darkMode ? 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    chipActive: 'bg-blue-500 text-white',
    badge: darkMode ? 'bg-gray-600/60 text-gray-200' : 'bg-slate-100 text-slate-600',

    // Icons
    iconMuted: darkMode ? 'text-gray-400' : 'text-slate-400',
  }), [darkMode]);

  const value = {
    darkMode,
    setDarkMode,
    toggleDarkMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export for direct context access if needed
export default ThemeContext;
