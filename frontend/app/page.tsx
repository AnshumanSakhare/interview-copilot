'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioCapture, AUDIO_CONFIG, detectFillers } from '@/lib/audio';
import { InterviewCopilotWS, StreamMessage } from '@/lib/ws';
import styles from './page.module.css';

interface CopilotState {
  transcript: string;
  betterAnswer: string;
  suggestion: string;
  followUps: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<CopilotState>({
    transcript: '',
    betterAnswer: '',
    suggestion: '',
    followUps: '',
  });
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');

  const audioRef = useRef<AudioCapture | null>(null);
  const wsRef = useRef<InterviewCopilotWS | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  const mergeStreamText = (previous: string, incoming: string): string => {
    const prev = previous.trim();
    const next = incoming.trim();

    if (!next) return previous;
    if (!prev) return next;
    if (next === prev) return previous;
    if (next.startsWith(prev) || next.includes(prev)) return next;
    if (prev.endsWith(next) || prev.includes(next)) return previous;

    return `${previous} ${next}`.trim();
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const configuredWsUrl = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // In production, require explicit NEXT_PUBLIC_WS_URL so deployments don't silently
    // try localhost and fail with a generic disconnect message.
    const wsUrl = configuredWsUrl || (isLocalhost ? 'ws://localhost:8000/ws' : '');

    if (!wsUrl) {
      setError('Missing NEXT_PUBLIC_WS_URL. Set it in Vercel to wss://<your-render-service>/ws and redeploy.');
      setStatus('Connection failed');
      return;
    }

    wsRef.current = new InterviewCopilotWS(wsUrl);

    wsRef.current
      .connect(
        (message: StreamMessage) => handleMessage(message),
        (error: string) => {
          setError(error);
          setIsConnected(false);
          setStatus('Connection error');
        },
        () => {
          setIsConnected(false);
          setStatus('Disconnected (retrying...)');
        },
        () => {
          setIsConnected(true);
          setError('');
          setStatus('Connected to backend');
        }
      )
      .then(() => {
        // Initial connect handled by onOpen callback for consistency with reconnects.
      })
      .catch((err) => {
        setError(`Failed to connect (${wsUrl}): ${err.message}`);
        setStatus('Connection failed');
      });

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  const handleMessage = (message: StreamMessage) => {
    const { type, content } = message;

    setState((prev) => {
      const updated = { ...prev };
      switch (type) {
        case 'transcript':
          updated.transcript = mergeStreamText(prev.transcript, content);
          break;
        case 'better_answer':
          updated.betterAnswer = mergeStreamText(prev.betterAnswer, content);
          break;
        case 'suggestion':
          updated.suggestion = content;
          break;
        case 'follow_ups':
          updated.followUps = mergeStreamText(prev.followUps, content);
          break;
        case 'error':
          setError(content);
          break;
      }
      return updated;
    });
  };

  const startRecording = async () => {
    if (!isConnected) {
      setError('Not connected to backend');
      return;
    }

    try {
      setError('');
      setStatus('Starting audio capture...');
      
      // Reset state for new session
      setState({
        transcript: '',
        betterAnswer: '',
        suggestion: '',
        followUps: '',
      });
      transcriptRef.current = '';
      interimTranscriptRef.current = '';

      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalizedChunk = '';
          let interimChunk = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalizedChunk += ` ${result[0].transcript}`;
            } else {
              interimChunk += ` ${result[0].transcript}`;
            }
          }

          if (finalizedChunk.trim()) {
            transcriptRef.current = `${transcriptRef.current} ${finalizedChunk}`.trim();
          }

          interimTranscriptRef.current = interimChunk.trim();

          const liveTranscript = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
          if (liveTranscript) {
            setState((prev) => ({
              ...prev,
              transcript: liveTranscript,
            }));
          }
        };

        recognition.onerror = () => {
          setStatus('Recording (speech recognition limited; audio will be analyzed on stop)');
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      audioRef.current = new AudioCapture();
      await audioRef.current.start((chunk: Uint8Array) => {
        if (wsRef.current && wsRef.current.isConnected()) {
          wsRef.current.sendAudio(chunk);
        }
      });

      setIsRecording(true);
      setStatus('Recording...');
      wsRef.current?.sendControl('start');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setStatus('Ready');
    }
  };

  const stopRecording = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current = null;
      }

      setIsRecording(false);
      setStatus('Processing...');
      wsRef.current?.sendControl('stop');
      const finalTranscript = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
      interimTranscriptRef.current = '';
      if (finalTranscript) {
        setState((prev) => ({
          ...prev,
          transcript: finalTranscript,
        }));
        wsRef.current?.sendJson({
          type: 'analyze_text',
          content: finalTranscript,
        });
      }

      // Wait a bit for final responses
      setTimeout(() => {
        setStatus('Complete');
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error stopping recording';
      setError(message);
    }
  };

  const hasFillers = state.suggestion.length > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎤 Interview Copilot</h1>
        <p>Real-time AI coaching with Gemini 3.1 Flash Live</p>
      </header>

      <div className={styles.section}>
        <h2>✅ Quick Tip Before You Start</h2>
        <div className={styles.content}>
          <p>
            Use this simple structure while speaking: <strong>Situation - Action - Result</strong>.
          </p>
          <p>
            Example: "In my last project, our checkout was slow (Situation). I optimized queries and caching (Action). Page load time dropped by 35% and conversions improved (Result)."
          </p>
        </div>
      </div>

      <div className={styles.statusBar}>
        <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></div>
        <span className={styles.statusText}>
          {isConnected ? '✓ Connected' : '✗ Disconnected'}
        </span>
        <span className={styles.statusText}>{status}</span>
      </div>

      {error && <div className={styles.errorBar}>{error}</div>}

      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={startRecording}
          disabled={isRecording || !isConnected}
        >
          {isRecording ? '⏹️ Recording' : '🎙️ Start Recording'}
        </button>
        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={stopRecording}
          disabled={!isRecording}
        >
          ⏹️ Stop
        </button>
      </div>

      <div className={styles.responseGrid}>
        {/* Transcript Section */}
        <div className={styles.section}>
          <h2>📝 Transcript</h2>
          <div className={styles.content}>
            {state.transcript || <span className={styles.placeholder}>Your speech will appear here...</span>}
          </div>
        </div>

        {/* Better Answer Section */}
        <div className={styles.section}>
          <h2>✨ Better Answer</h2>
          <div className={styles.content}>
            {state.betterAnswer || <span className={styles.placeholder}>AI-improved answer will appear here...</span>}
          </div>
        </div>

        {/* Suggestion Section */}
        {hasFillers && (
          <div className={`${styles.section} ${styles.warning}`}>
            <h2>💡 Suggestion</h2>
            <div className={styles.content}>
              {state.suggestion}
            </div>
          </div>
        )}

        {/* Follow-ups Section */}
        <div className={styles.section}>
          <h2>❓ Follow-up Questions</h2>
          <div className={styles.content}>
            {state.followUps || <span className={styles.placeholder}>Next questions will appear here...</span>}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>Audio Format: PCM16 @ 16kHz | WebSocket Streaming</p>
        <p>Powered by Gemini 3.1 Flash Live</p>
      </footer>
    </div>
  );
}
