import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  return useContext(RoleContext);
};

export const RoleProvider = ({ children }) => {
  // Always default to 'student' when the app first loads
  const [role, setRole] = useState('student');

  // Expose role string and a helper function to toggle/switch
  const value = {
    role,
    setRole,
    isAdmin: role === 'admin',
    isStudent: role === 'student',
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
