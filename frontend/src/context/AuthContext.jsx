import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  // Will be passed down to AuthContext.Provider
  const value = {
    session,
    user,
    loading,
    signUp: (data) => supabase?.auth.signUp(data),
    signIn: (data) => supabase?.auth.signInWithPassword(data),
    signOut: () => supabase?.auth.signOut(),
    resetPassword: (email) => supabase?.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
    updatePassword: (newPassword) => supabase?.auth.updateUser({ password: newPassword }),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
