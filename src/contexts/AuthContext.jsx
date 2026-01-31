import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '../useAuth';

// Create the context
const AuthContext = createContext(null);

// Auth provider component - wraps the existing useAuth hook in a context
export const AuthProvider = ({ children }) => {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for direct context access if needed
export default AuthContext;
