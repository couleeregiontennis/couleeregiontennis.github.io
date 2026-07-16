import { useState, useEffect, useRef } from 'react';
import { supabase, supabaseConfig } from '../scripts/supabaseClient';
import { getActionableErrorMessage } from './voiceErrorUtils';

export const useVoiceScoreInput = (onScoreParsed) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState('');
  const [aiError, setAiError] = useState('');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const onScoreParsedRef = useRef(onScoreParsed);
  onScoreParsedRef.current = onScoreParsed;

  useEffect(() => {
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type the score manually.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setRecognitionError('');
      setAiSuccess('');
      setAiError('');
      setTranscript('');
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += piece;
        } else {
          interim += piece;
        }
      }

      finalTranscriptRef.current = final;
      interimTranscriptRef.current = interim;
      setTranscript(final || interim);
    };

    recognition.onerror = (event) => {
      setRecognitionError(`Speech recognition error: ${event.error}. Please try again or type the score manually.`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = (finalTranscriptRef.current || interimTranscriptRef.current).trim();
      if (text) {
        parseTranscriptWithAI(text);
      } else {
        setRecognitionError('No speech was heard. Please try again or type the score manually.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Already stopped; ignore.
        }
      }
    };
  }, []); // intentionally empty: recognition instance is created once per mount

  const parseTranscriptWithAI = async (text) => {
    setAiProcessing(true);
    setAiError('');
    setAiSuccess('');

    let statusCode = null;
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('No speech was detected. Please try again.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated.');
      }

      const baseUrl = supabaseConfig.url || supabase.supabaseUrl;
      if (!baseUrl) {
        throw new Error('Supabase URL is not configured.');
      }

      const response = await fetch(`${baseUrl}/functions/v1/parse-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transcript: trimmed }),
      });

      statusCode = response.status;

      if (!response.ok) {
        let errorMessage = `AI parsing failed with status: ${statusCode}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Response body was not valid JSON; use the status message above.
        }
        throw new Error(errorMessage);
      }

      const parsedData = await response.json();
      setAiSuccess('Transcript parsed successfully by AI!');
      if (onScoreParsedRef.current) {
        onScoreParsedRef.current(parsedData);
      }
      return parsedData;
    } catch (err) {
      setAiError(getActionableErrorMessage(err, statusCode));
      return null;
    } finally {
      setAiProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setRecognitionError('');
      setAiError('');
      setAiSuccess('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        setRecognitionError(`Could not start speech recognition: ${err.message}. Please try again.`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Already stopped; ignore.
      }
    }
  };

  return {
    isListening,
    transcript,
    recognitionError,
    aiProcessing,
    aiSuccess,
    aiError,
    startListening,
    stopListening,
    isSpeechRecognitionSupported: !!SpeechRecognition,
  };
};
