import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './Login.module.css';

export default function Login() {
  const { login, register, googleLoginUrl } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) { setError('נא למלא אימייל וסיסמה'); return; }
    if (mode === 'register' && !form.name) { setError('נא למלא שם מלא'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.name, form.phone, form.password);
      }
      navigate('/dashboard');
    } catch (e) {
      setError(e?.detail || 'שגיאה — נסה שנית');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/logo.png" alt="DinLink" className={styles.logo} />
          <h1 className={styles.title}>
            <span className={styles.titleDin}>Din</span><span className={styles.titleLink}>Link</span>
          </h1>
          <p className={styles.sub}>הפלטפורמה הדיגיטלית לבתי הדין</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            כניסה
          </button>
          <button className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            הרשמה
          </button>
        </div>

        <div className={styles.form}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label>שם מלא</label>
              <input type="text" placeholder="ישראל ישראלי" value={form.name} onChange={e => up('name', e.target.value)} />
            </div>
          )}

          <div className={styles.field}>
            <label>אימייל</label>
            <input type="email" placeholder="israel@example.com" value={form.email} onChange={e => up('email', e.target.value)} dir="ltr" />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label>טלפון (אופציונלי)</label>
              <input type="tel" placeholder="050-0000000" value={form.phone} onChange={e => up('phone', e.target.value)} />
            </div>
          )}

          <div className={styles.field}>
            <label>סיסמה</label>
            <div className={styles.passRow}>
              <input type={show ? 'text' : 'password'} placeholder="לפחות 8 תווים" value={form.password} onChange={e => up('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} dir="ltr" />
              <button type="button" className={styles.eyeBtn} onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}><AlertCircle size={13} /> {error}</div>
          )}

          <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : (mode === 'login' ? 'כניסה' : 'הרשמה')}
          </button>

          <div className={styles.divider}><span>או</span></div>

          <a href={googleLoginUrl()} className={styles.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.2 5.2C36.9 36.2 44 31 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>
            כניסה עם Google
          </a>
        </div>
      </div>
    </div>
  );
}
