import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.warn('Error fetching user role:', error.message);
        }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        try {
          const newUserId = session?.user?.id;

          setSession(session);
          setUser(session?.user ?? null);

          if (newUserId) {
            await fetchUserRole(newUserId);
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
