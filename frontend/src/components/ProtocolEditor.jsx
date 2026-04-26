import { useState, useEffect, useRef } from 'react';
import { Save, Check, FileText, Plus, Loader, ExternalLink, FileEdit } from 'lucide-react';
import { api } from '../api/client';
import styles from './ProtocolEditor.module.css';

const TYPE_LABELS = {
  hearing_protocol: 'פרוטוקול דיון',
  verdict: 'פסק דין',
};

const TYPE_PLACEHOLDERS = {
  hearing_protocol: 'נכחו: ...\n\nבית הדין שמע את טענות הצדדים...\n\nהתובע טען: ...\n\nהנתבע השיב: ...',
  verdict: 'לאחר ששמענו את טענות הצדדים ובחנו את המסמכים שהוגשו, באנו לכלל מסקנה כי...\n\nאשר על כן, אנו פוסקים:',
};

/**
 * Edits a single CaseProtocol with debounced auto-save.
 * Props:
 *  - caseId
 *  - type: 'hearing_protocol' | 'verdict'
 */
export default function ProtocolEditor({ caseId, type }) {
  const [protocol, setProtocol] = useState(null); // null = doesn't exist yet
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState('');
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/dayan/cases/${caseId}/protocols`)
      .then((items) => {
        if (cancelled) return;
        const existing = items.find(p => p.type === type);
        if (existing) {
          setProtocol(existing);
          setTitle(existing.title || '');
          setContent(existing.content || '');
        } else {
          setProtocol(null);
          setTitle('');
          setContent('');
        }
      })
      .catch(() => setError('שגיאה בטעינת המסמך'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [caseId, type]);

  // Auto-save: when content/title change, schedule a save 1.5s later
  useEffect(() => {
    if (loading) return;
    if (!dirtyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(), 1500);
    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [title, content, loading]);

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const created = await api.post(`/dayan/cases/${caseId}/protocols`, {
        type, title: title || TYPE_LABELS[type], content: content || '',
      });
      setProtocol(created);
      setSavedAt(new Date());
      dirtyRef.current = false;
      // If Drive Doc was created, open it in a new tab automatically
      if (created.drive_edit_url) {
        window.open(created.drive_edit_url, '_blank', 'noopener');
      }
    } catch (e) {
      setError(e?.detail || 'שגיאה ביצירת המסמך');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!protocol) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.put(`/dayan/protocols/${protocol.id}`, { title, content });
      setProtocol(updated);
      setSavedAt(new Date());
      dirtyRef.current = false;
    } catch (e) {
      setError(e?.detail || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const onChange = (setter) => (e) => {
    dirtyRef.current = true;
    setter(e.target.value);
  };

  if (loading) {
    return <div className={styles.loading}>טוען...</div>;
  }

  if (!protocol) {
    return (
      <div className={styles.empty}>
        <FileText size={32} />
        <p>אין {TYPE_LABELS[type]} בתיק עדיין</p>
        <button className={styles.createBtn} onClick={create} disabled={saving}>
          {saving ? <Loader size={14} className={styles.spin} /> : <Plus size={14} />}
          {saving ? 'יוצר מסמך...' : `צור ${TYPE_LABELS[type]} חדש`}
        </button>
        <p className={styles.hint}>המסמך ייפתח בחלון חדש לעריכה (Google Docs)</p>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    );
  }

  // Drive-backed protocol — show "open in editor" button
  if (protocol.drive_edit_url) {
    return (
      <div className={styles.driveDoc}>
        <div className={styles.driveHead}>
          <div>
            <h3 className={styles.driveTitle}>
              <FileEdit size={18} /> {protocol.title || TYPE_LABELS[type]}
            </h3>
            <p className={styles.driveSub}>נערך ב-Google Docs · ניתן לייצא ל-Word דרך File → Download</p>
          </div>
          <a href={protocol.drive_edit_url} target="_blank" rel="noopener" className={styles.openBtn}>
            <ExternalLink size={15} /> פתח לעריכה
          </a>
        </div>
        <iframe
          src={protocol.drive_edit_url.replace('/edit', '/preview')}
          title={protocol.title || TYPE_LABELS[type]}
          className={styles.driveFrame}
        />
      </div>
    );
  }

  // Fallback — Drive not configured, use in-app textarea
  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <input
          className={styles.titleInput}
          placeholder="כותרת"
          value={title}
          onChange={onChange(setTitle)}
        />
        <div className={styles.status}>
          {saving ? (
            <><Loader size={12} className={styles.spin} /> שומר...</>
          ) : savedAt ? (
            <><Check size={12} /> נשמר {savedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</>
          ) : (
            <span className={styles.idleStatus}>שמירה אוטומטית מופעלת</span>
          )}
        </div>
      </div>

      <textarea
        className={styles.textarea}
        value={content}
        onChange={onChange(setContent)}
        placeholder={TYPE_PLACEHOLDERS[type]}
        rows={20}
      />

      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={save} disabled={saving}>
          <Save size={14} /> שמור עכשיו
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
