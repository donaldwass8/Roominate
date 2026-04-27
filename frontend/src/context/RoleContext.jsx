import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  return useContext(RoleContext);
};

export const RoleProvider = ({ children }) => {
  // Initialize role from localStorage or default to 'student'
  const [role, setRole] = useState(() => {
    const savedRole = localStorage.getItem('appRole');
    return savedRole || 'student';
  });

  // Whenever role changes, save it to localStorage
  useEffect(() => {
    localStorage.setItem('appRole', role);
  }, [role]);

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
