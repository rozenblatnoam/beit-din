import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockDayans, ADMIN_CODE } from '../context/AppContext';
import styles from './DayanLogin.module.css';

export default function DayanLogin() {
  const { setLoggedDayan, setIsAdmin } = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!code.trim()) { setError('נא להזין קוד כניסה'); return; }
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (code === ADMIN_CODE) {
        setIsAdmin(true);
        setLoggedDayan(null);
        navigate('/admin/scheduler');
      } else {
        const dayan = mockDayans.find(d => d.code === code);
        if (dayan) {
          setLoggedDayan(dayan);
          setIsAdmin(false);
          navigate('/dayan/portal');
        } else {
          setError('קוד שגוי — אנא נסה שנית');
          setLoading(false);
        }
      }
    }, 600);
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
          <p className={styles.sub}>הזן את קוד הכניסה האישי שלך</p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputWrap}>
            <label className={styles.label}>קוד כניסה</label>
            <div className={styles.inputRow}>
              <input
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                type={show ? 'text' : 'password'}
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                placeholder="הזן קוד אישי"
                maxLength={6}
                autoFocus
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

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : (
              <><Gavel size={15} /> כניסה למערכת</>
            )}
          </button>
        </div>

        <div className={styles.hint}>
          <ShieldCheck size={13} />
          <span>כניסת מנהל — קוד 4 ספרות מיוחד</span>
        </div>

        {/* demo helper */}
        <div className={styles.demo}>
          <div className={styles.demoTitle}>קודות לדמו:</div>
          <div className={styles.demoGrid}>
            {mockDayans.map(d => (
              <button key={d.id} className={styles.demoChip} onClick={() => setCode(d.code)}>
                {d.short} — {d.code}
              </button>
            ))}
            <button className={`${styles.demoChip} ${styles.demoAdmin}`} onClick={() => setCode(ADMIN_CODE)}>
              מנהל — {ADMIN_CODE}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}