import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';

export const useSeason = () => {
    const [currentSeason, setCurrentSeason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSeason = async () => {
            try {
                setLoading(true);

                // Logic: Fetch the most recent season by end_date
                const { data, error } = await supabase
                    .from('season')
                    .select('*')
                    .order('end_date', { ascending: false })
                    .limit(1)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') {
                        console.error('useSeason: DB Error', error);
                        throw error;
                    }
                    // No seasons found
                    console.log('useSeason: No season found (PGRST116)');
                    setCurrentSeason(null);
                } else {
                    console.log('useSeason: Found season:', data);
                    setCurrentSeason(data);
                }
            } catch (err) {
                console.error('useSeason: Catch Error:', err);
                setError(err.message);
            } finally {
                console.log('useSeason: Finished loading');
                setLoading(false);
            }
        };

        fetchSeason();
    }, []);

    return { currentSeason, loading, error };
};
