import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Create the context
const ThemeContext = createContext(null);

// Theme provider component - Meridian Cairn Color System
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

  // Memoized theme object - Meridian Cairn palette
  const theme = useMemo(() => ({
    // Backgrounds
    bg: darkMode ? 'bg-near-black' : 'bg-warm-white',
    card: darkMode ? 'bg-slate-800/90 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50',
    cardAlt: darkMode ? 'bg-slate-700/80' : 'bg-slate-50/80',
    cardHover: 'card-hover',

    // Text
    text: darkMode ? 'text-warm-white' : 'text-slate-800',
    textMuted: darkMode ? 'text-slate-300' : 'text-slate-500',
    textSubtle: darkMode ? 'text-slate-400' : 'text-slate-400',
    textDisabled: darkMode ? 'text-slate-500' : 'text-slate-400',

    // Borders
    border: darkMode ? 'border-slate-700/50' : 'border-slate-200/50',

    // Inputs
    input: darkMode
      ? 'bg-slate-700/80 border-slate-600 text-warm-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/50'
      : 'bg-white/90 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/50',

    // Layout
    header: darkMode ? 'glass-dark' : 'bg-gradient-to-r from-slate-800 to-slate-900',
    nav: darkMode ? 'glass-dark' : 'bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-lg shadow-slate-200/20',
    modal: darkMode ? 'bg-slate-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl shadow-2xl',
    modalBackdrop: 'modal-backdrop',

    // Effects
    glass: darkMode ? 'glass-dark' : 'glass-light',
    gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
    gradientText: 'gradient-text',

    // Buttons
    btnPrimary: 'bg-amber-500 hover:bg-amber-600 text-white',
    btnDisabled: darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-400',
    btnSecondary: darkMode ? 'bg-slate-600/60 hover:bg-slate-500/60 text-warm-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnGhost: darkMode ? 'hover:bg-slate-700/50 text-slate-200' : 'hover:bg-slate-100 text-slate-600',

    // Chips and badges
    chip: darkMode ? 'bg-slate-600/50 text-slate-200 hover:bg-slate-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    chipActive: 'bg-amber-500 text-white',
    badge: darkMode ? 'bg-slate-600/60 text-slate-200' : 'bg-slate-100 text-slate-600',

    // Icons
    iconMuted: darkMode ? 'text-slate-400' : 'text-slate-400',

    // Accent colors
    accent: 'text-amber-500',
    accentBg: 'bg-amber-500',
    accentHover: 'hover:bg-amber-600',

    // Status colors
    success: darkMode ? 'text-nominal' : 'text-nominal',
    successBg: 'bg-nominal',
    warning: 'text-warning',
    warningBg: 'bg-warning',
    error: 'text-critical',
    errorBg: 'bg-critical',
    info: 'text-info',
    infoBg: 'bg-info',

    // Sage (secondary) accent
    sage: 'text-sage-500',
    sageBg: 'bg-sage-500',
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
