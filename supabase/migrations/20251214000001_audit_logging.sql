-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT, -- Can be UUID or other ID converted to string
    operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs (assuming an 'admin' role or similar logic exists, 
-- but for now we'll allow authenticated users to view logs if they are implementing an admin UI)
-- Adjust this policy based on your specific RLS needs. 
-- For strict security: only allow service_role to insert, and specific admins to select.
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (true); -- customize this check (e.g., auth.email() = 'admin@example.com')

-- Audit Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    old_payload JSONB;
    record_identifier TEXT;
    user_id UUID;
BEGIN
    -- Try to get the current user ID
    user_id := auth.uid();

    -- Determine record ID (assumes 'id' column exists, otherwise generic fallback)
    IF (TG_OP = 'DELETE') THEN
        payload := to_jsonb(OLD);
        -- specific handling for tables without standard 'id' can be added here
        BEGIN
            record_identifier := OLD.id::TEXT;
        EXCEPTION WHEN OTHERS THEN
            record_identifier := 'composite/unknown';
        END;
    ELSE
        payload := to_jsonb(NEW);
        IF (TG_OP = 'UPDATE') THEN
            old_payload := to_jsonb(OLD);
        END IF;
        
        BEGIN
            record_identifier := NEW.id::TEXT;
        EXCEPTION WHEN OTHERS THEN
            record_identifier := 'composite/unknown';
        END;
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        record_identifier,
        TG_OP,
        old_payload,
        payload,
        user_id
    );

    RETURN NULL; -- Result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist to allow clean re-application
DROP TRIGGER IF EXISTS audit_team_changes ON public.team;
DROP TRIGGER IF EXISTS audit_player_changes ON public.player;
DROP TRIGGER IF EXISTS audit_matches_changes ON public.matches;
DROP TRIGGER IF EXISTS audit_match_scores_changes ON public.match_scores;
DROP TRIGGER IF EXISTS audit_line_results_changes ON public.line_results;
DROP TRIGGER IF EXISTS audit_player_to_team_changes ON public.player_to_team;

-- Apply Triggers to relevant tables

-- Team
CREATE TRIGGER audit_team_changes
AFTER INSERT OR UPDATE OR DELETE ON public.team
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Player
CREATE TRIGGER audit_player_changes
AFTER INSERT OR UPDATE OR DELETE ON public.player
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Matches
CREATE TRIGGER audit_matches_changes
AFTER INSERT OR UPDATE OR DELETE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Match Scores
CREATE TRIGGER audit_match_scores_changes
AFTER INSERT OR UPDATE OR DELETE ON public.match_scores
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Line Results
CREATE TRIGGER audit_line_results_changes
AFTER INSERT OR UPDATE OR DELETE ON public.line_results
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Player to Team (Roster)
CREATE TRIGGER audit_player_to_team_changes
AFTER INSERT OR UPDATE OR DELETE ON public.player_to_team
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
