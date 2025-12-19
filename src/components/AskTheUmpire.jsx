import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/AskTheUmpire.css';

export const AskTheUmpire = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer('');
    setError(null);

    try {
      const startedAt = Date.now();
      console.log('[AskTheUmpire] invoking ask-umpire...', { queryLength: query.length });

      // Debug: Attempt raw fetch to verify network path
      // This helps diagnose if supabase-js is misconfigured or if it's a network block
      const projectUrl = supabase.supabaseUrl;
      const functionUrl = `${projectUrl}/functions/v1/ask-umpire`;
      console.log('[AskTheUmpire] Target URL:', functionUrl);

      const { data, error } = await supabase.functions.invoke('ask-umpire', {
        body: { query },
      });

      if (error) {
        console.error('[AskTheUmpire] Invocation error object:', error);
        throw error;
      }
      
      console.log('[AskTheUmpire] response received', { elapsedMs: Date.now() - startedAt, data });
      setAnswer(data.answer || "I couldn't find an answer to that.");
    } catch (err) {
      console.error('AskTheUmpire error:', err);

      const errorMessage = err?.message || '';
      const errorName = err?.name || '';
      const isNetworkError =
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Failed to send a request to the Edge Function') ||
        errorName === 'FunctionsFetchError';

      if (isNetworkError) {
        setError('Connection blocked. If you are using an ad-blocker or privacy extension, please disable it for this site or allow requests to supabase.co.');
      } else {
        // For demo purposes if backend isn't ready, fail gracefully or show mock
        // But adhering to strict instructions, I should assume function exists.
        // If it fails (e.g. 404), I show error.
        setError('Sorry, something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`umpire-trigger ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Ask the Umpire"
      >
        🎾 Ask the Umpire
      </button>

      {isOpen && (
        <div className="umpire-widget">
          <div className="umpire-header">
            <h3>Ask the Umpire</h3>
            <button
              className="umpire-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="umpire-body">
            {answer && <div className="umpire-response">{answer}</div>}
            {error && <div className="umpire-error">{error}</div>}
            {!answer && !loading && !error && (
              <p className="umpire-intro">
                Have a question about the rules? Ask me anything!
              </p>
            )}
            {loading && <div className="umpire-loading">Thinking...</div>}
          </div>
          <form onSubmit={handleSubmit} className="umpire-form">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Can I play down a level?"
              maxLength={300} // Security: Limit input length to prevent DoS/Cost abuse
              disabled={loading}
              className="umpire-input"
            />
            <button type="submit" disabled={loading || !query.trim()} className="umpire-submit">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};
