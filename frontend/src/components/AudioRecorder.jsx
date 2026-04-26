import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Upload, Trash2, Loader } from 'lucide-react';
import styles from './AudioRecorder.module.css';

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Records audio via MediaRecorder, lets user preview, and calls onUpload(file)
 * with the resulting Blob (as a File so the upload endpoint accepts it).
 */
export default function AudioRecorder({ onUpload, uploading }) {
  const [state, setState] = useState('idle'); // idle | recording | paused | ready
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const blobRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, []);

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('ready');
        // release the mic
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mr.start();
      recorderRef.current = mr;
      setState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    } catch (e) {
      setError('לא ניתן לגשת למיקרופון. אשר הרשאה בדפדפן ונסה שוב.');
      console.error(e);
    }
  };

  const pause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      clearInterval(timerRef.current);
      setState('paused');
    } else if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
      setState('recording');
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    clearInterval(timerRef.current);
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    blobRef.current = null;
    setState('idle');
    setElapsed(0);
  };

  const upload = async () => {
    if (!blobRef.current) return;
    const fileName = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    const file = new File([blobRef.current], fileName, { type: 'audio/webm' });
    try {
      await onUpload(file);
      reset();
    } catch (e) {
      setError(e?.detail || 'שגיאה בהעלאה');
    }
  };

  return (
    <div className={styles.recorder}>
      <div className={styles.controls}>
        {state === 'idle' && (
          <button className={styles.startBtn} onClick={start}>
            <Mic size={16} /> התחל הקלטה
          </button>
        )}

        {(state === 'recording' || state === 'paused') && (
          <>
            <div className={styles.live}>
              {state === 'recording' && <span className={styles.dot} />}
              <span className={styles.time}>{formatTime(elapsed)}</span>
              <span className={styles.label}>
                {state === 'recording' ? 'מקליט...' : 'מושהה'}
              </span>
            </div>
            <button className={styles.iconBtn} onClick={pause} title={state === 'recording' ? 'השהה' : 'המשך'}>
              {state === 'recording' ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button className={styles.stopBtn} onClick={stop}>
              <Square size={14} /> סיים
            </button>
          </>
        )}

        {state === 'ready' && (
          <>
            <audio src={audioUrl} controls className={styles.audio} />
            <button className={styles.iconBtn} onClick={reset} title="מחק והתחל מחדש">
              <Trash2 size={14} />
            </button>
            <button className={styles.uploadBtn} onClick={upload} disabled={uploading}>
              {uploading ? <Loader size={14} className={styles.spin} /> : <Upload size={14} />}
              {uploading ? 'מעלה...' : 'שמור הקלטה'}
            </button>
          </>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
