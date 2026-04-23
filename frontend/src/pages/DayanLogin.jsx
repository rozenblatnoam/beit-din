import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './DayanLogin.module.css';

export default function DayanLogin() {
  const { loginDayan, googleDayanLoginUrl } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError('נא למלא אימייל וסיסמה'); return; }
    setLoading(true);
    setError('');
    try {
      await loginDayan(email, password);
      navigate('/dayan/portal');
    } catch (e) {
      setError(e?.detail || 'אימייל או סיסמה שגויים');
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Gavel size={28} strokeWidth={1.5} />
          </div>
          <h1 className={styles.title}>כניסת דיינים</h1>
          <p className={styles.sub}>הזן את פרטי הכניסה שלך</p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputWrap}>
            <label className={styles.label}>אימייל</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              placeholder="dayan@example.com"
              dir="ltr"
              autoFocus
            />
          </div>

          <div className={styles.inputWrap}>
            <label className={styles.label}>סיסמה</label>
            <div className={styles.inputRow}>
              <input
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                placeholder="הזן סיסמה"
                dir="ltr"
              />
              <button className={styles.eyeBtn} onClick={() => setShow(s => !s)} type="button">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div className={styles.errorMsg}>
                <AlertCircle size={13} /> {error}
              </div>
            )}
          </div>

          <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : (
              <><Gavel size={15} /> כניסה למערכת</>
            )}
          </button>

          <div className={styles.divider}><span>או</span></div>

          <a href={googleDayanLoginUrl()} className={styles.googleBtn}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.2 5.2C36.9 36.2 44 31 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>
            כניסה עם Google
          </a>
        </div>

        <div className={styles.hint}>
          <ShieldCheck size={13} />
          <span>דיינים נוצרים על ידי מנהל המערכת בלבד</span>
        </div>
      </div>
    </div>
  );
}
