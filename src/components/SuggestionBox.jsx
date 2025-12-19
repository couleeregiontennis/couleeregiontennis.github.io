import React, { useState } from "react";
import Turnstile from "react-turnstile";
import { supabase } from "../scripts/supabaseClient";
import "../styles/SuggestionBox.css";
import { LoadingSpinner } from "./LoadingSpinner";

export const SuggestionBox = () => {
  const [suggestion, setSuggestion] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [message, setMessage] = useState("");

  const handleSuggestionChange = (e) => {
    setSuggestion(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setMessage("Please complete the CAPTCHA.");
      return;
    }
    if (suggestion.length < 10 || suggestion.length > 1000) {
      setMessage("Suggestion must be between 10 and 1000 characters.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const { error } = await supabase.functions.invoke("submit-suggestion", {
        body: {
          content: suggestion,
          captchaToken: turnstileToken,
        },
      });

      if (error) throw error;

      setStatus("success");
      setMessage("Thank you for your feedback!");
      setSuggestion("");
      setTurnstileToken("");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      setStatus("error");
      setMessage("Failed to submit suggestion. Please try again.");
    }
  };

  return (
    <div className="suggestion-box-page">
      <div className="suggestion-box-container">
        <h1>Anonymous Suggestion Box</h1>
        <p>We value your feedback. Please let us know how we can improve.</p>

        {status === "success" ? (
          <div className="success-message">
            <p>{message}</p>
            <button onClick={() => setStatus("idle")} className="submit-button">
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="suggestion-form">
            <div className="form-group">
              <label htmlFor="suggestion">
                Your Suggestion (10-1000 characters)
              </label>
              <textarea
                id="suggestion"
                value={suggestion}
                onChange={handleSuggestionChange}
                minLength={10}
                maxLength={1000}
                required
                placeholder="Type your suggestion here..."
                aria-describedby="suggestion-counter"
              />
              <div id="suggestion-counter" className="character-count">
                {suggestion.length} / 1000 characters
              </div>
            </div>

            <div className="captcha-container">
              <Turnstile
                sitekey={
                  import.meta.env.VITE_TURNSTILE_SITE_KEY ||
                  "1x00000000000000000000AA"
                }
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => setMessage("CAPTCHA error.")}
                onExpire={() => setTurnstileToken("")}
              />
            </div>

            {message && <div className={`message ${status}`}>{message}</div>}

            <button
              type="submit"
              className="submit-button"
              disabled={
                status === "submitting" ||
                !turnstileToken ||
                suggestion.length < 10
              }
            >
              {status === "submitting" ? (
                <span className="submit-loading-content">
                  <LoadingSpinner size="sm" />
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
