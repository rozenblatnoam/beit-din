import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon, FolderOpen, FileText, ExternalLink, User, Gavel, Briefcase,
} from 'lucide-react';
import { api } from '../api/client';
import styles from './Search.module.css';

const statusLabel = {
  open: 'פעיל', pending: 'ממתין לתגובה', docs: 'השלמת מסמכים', closed: 'נסגר',
};

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/search/?q=${encodeURIComponent(q.trim())}`);
      setResults(data);
    } catch (e) {
      setError(e?.detail || 'שגיאה בחיפוש');
    } finally {
      setLoading(false);
    }
  };

  const personIcon = (type) => {
    if (type === 'dayan') return <Gavel size={14} />;
    if (type === 'lawyer') return <Briefcase size={14} />;
    return <User size={14} />;
  };

  const personLabel = (type) => {
    if (type === 'dayan') return 'דיין';
    if (type === 'lawyer') return 'עו"ד/טו"ר';
    return 'משתמש';
  };

  const total = results ? results.cases.length + results.documents.length + results.people.length : 0;

  return (
    <div className="page-content">
      <div className={styles.searchBox}>
        <SearchIcon size={20} className={styles.searchIcon} />
        <input
          autoFocus
          className={styles.input}
          placeholder="חפש לפי שם לקוח, מספר תיק, נושא, או שם מסמך..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button className={styles.btn} onClick={search} disabled={loading}>
          {loading ? '...' : 'חפש'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {results && (
        <div className={styles.results}>
          <div className={styles.summary}>
            נמצאו <strong>{total}</strong> תוצאות עבור "{results.query}"
          </div>

          {results.cases.length > 0 && (
            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}>
                <FolderOpen size={16} /> תיקים ({results.cases.length})
              </h3>
              <div className={styles.list}>
                {results.cases.map((c) => (
                  <button key={`case-${c.id}`} className={styles.row}
                    onClick={() => navigate('/dashboard')}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>
                        <strong>{c.case_number}</strong> — {c.subject}
                      </div>
                      <div className={styles.rowMeta}>
                        לקוח: {c.client_name} • סטטוס: {statusLabel[c.status] || c.status}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.documents.length > 0 && (
            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}>
                <FileText size={16} /> מסמכים ({results.documents.length})
              </h3>
              <div className={styles.list}>
                {results.documents.map((d) => (
                  <a key={`doc-${d.id}`} className={styles.row}
                    href={d.drive_view_url || '#'} target="_blank" rel="noreferrer">
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>{d.name}</div>
                      <div className={styles.rowMeta}>תיק {d.case_number}</div>
                    </div>
                    {d.drive_view_url && <ExternalLink size={14} className={styles.rowIcon} />}
                  </a>
                ))}
              </div>
            </div>
          )}

          {results.people.length > 0 && (
            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}>
                <User size={16} /> אנשים ({results.people.length})
              </h3>
              <div className={styles.list}>
                {results.people.map((p) => (
                  <div key={`${p.type}-${p.id}`} className={styles.row}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>
                        {personIcon(p.type)} {p.name}
                      </div>
                      <div className={styles.rowMeta}>
                        {personLabel(p.type)} • {p.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && (
            <div className={styles.empty}>לא נמצאו תוצאות</div>
          )}
        </div>
      )}
    </div>
  );
}
