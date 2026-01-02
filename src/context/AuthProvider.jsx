import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../scripts/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState({ isCaptain: false, isAdmin: false });

  const fetchUserRole = async (userId) => {
    if (!userId) {
      setUserRole({ isCaptain: false, isAdmin: false });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('player')
        .select('is_captain, is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        // If the user is authenticated but has no player profile, they shouldn't be admin/captain
        // This can happen for new users or if the profile is missing
        console.warn('Error fetching user role or profile missing:', error.message);
        setUserRole({ isCaptain: false, isAdmin: false });
        return;
      }

      setUserRole({
        isCaptain: !!data?.is_captain,
        isAdmin: !!data?.is_admin
      });
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole({ isCaptain: false, isAdmin: false });
    }
  };

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchUserRole(initialSession.user.id);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserRole(session.user.id);
          } else {
            setUserRole({ isCaptain: false, isAdmin: false });
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = useMemo(() => ({
    session,
    user,
    loading,
    userRole,
    signOut,
  }), [session, user, loading, userRole, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
