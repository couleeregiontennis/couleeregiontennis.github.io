import { useState, useEffect, useRef } from 'react';
import { supabase } from '../scripts/supabaseClient'; // Assuming supabaseClient.js is in scripts

export const useVoiceScoreInput = (onScoreParsed) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState('');
  const [aiError, setAiError] = useState('');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  const parseTranscriptWithAI = async (text) => {
    setAiProcessing(true);
    setAiError('');
    setAiSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated.');
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/parse-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `AI parsing failed with status: ${response.status}`);
      }

      const parsedData = await response.json();
      console.log('AI Parsed Data:', parsedData);
      setAiSuccess('Transcript parsed successfully by AI!');
      if (onScoreParsed) {
        onScoreParsed(parsedData);
      }
      return parsedData;
    } catch (err) {
      setAiError('Error parsing score with AI: ' + err.message);
      return null;
    } finally {
      setAiProcessing(false);
    }
  };

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setRecognitionError('');
        setAiSuccess('');
        setAiError('');
        setTranscript('');
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        setRecognitionError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          parseTranscriptWithAI(transcript);
        }
      };
    } else {
      setRecognitionError('Speech Recognition not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [SpeechRecognition, transcript, onScoreParsed]); // Add onScoreParsed to dependencies

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
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
    isSpeechRecognitionSupported: !!SpeechRecognition
  };
};
