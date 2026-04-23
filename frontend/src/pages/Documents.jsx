import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, Filter, Download, Eye, Trash2, Loader } from 'lucide-react';
import styles from './Documents.module.css';

const TYPE_ICONS = { pdf: '📄', docx: '📝', doc: '📝', img: '🖼', png: '🖼', jpg: '🖼', jpeg: '🖼', default: '📁' };

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL');
}

export default function Documents() {
  const { docs, cases, loadDocs, uploadDoc, removeDoc } = useApp();
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (filter !== 'all') {
      loadDocs(filter).catch(() => {});
    }
  }, [filter]);

  const filtered = filter === 'all' ? docs : docs.filter(d => d.case_id === Number(filter));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (filter === 'all') { setError('בחר תיק ספציפי לפני העלאת מסמך'); return; }
    setError('');
    setUploading(true);
    try {
      await uploadDoc(Number(filter), file);
    } catch (err) {
      setError(err?.detail || 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('האם למחוק מסמך זה?')) return;
    try {
      await removeDoc(docId);
    } catch {
      setError('שגיאה במחיקה');
    }
  };

  return (
    <div className="page-content">
      <div className={styles.pageHeader}>
        <div className="section-title" style={{ margin: 0, flex: 1 }}>מסמכי התיקים</div>
        <div className={styles.headerActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select value={filter} onChange={e => setFilter(e.target.value)} className={styles.filterSelect}>
              <option value="all">כל התיקים</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.case_number} — {c.subject.slice(0, 20)}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader size={15} className={styles.spin} /> : <Upload size={15} />}
            {uploading ? 'מעלה...' : 'העלאת מסמך'}
          </button>
          <input ref={fileRef} type="file" style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleUpload} />
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statPill}>{docs.length} מסמכים סה"כ</div>
        <div className={styles.statPill}>{cases.length} תיקים</div>
        <div className={styles.statPill}>מאובטח SSL 🔐</div>
      </div>

      <div className={styles.docsGrid}>
        {filtered.map(doc => (
          <div key={doc.id} className={`card ${styles.docCard}`}>
            <div className={styles.docIcon}>{TYPE_ICONS[doc.file_type] || TYPE_ICONS.default}</div>
            <div className={styles.docInfo}>
              <div className={styles.docName}>{doc.name}</div>
              <div className={styles.docCase}>תיק #{doc.case_id}</div>
              <div className={styles.docMeta}>{formatDate(doc.uploaded_at)} · {formatSize(doc.size_bytes)}</div>
            </div>
            <div className={styles.docActions}>
              {doc.drive_view_url && (
                <a href={doc.drive_view_url} target="_blank" rel="noreferrer" className="btn-ghost" title="צפייה">
                  <Eye size={14} />
                </a>
              )}
              <button className="btn-ghost" title="הורדה"
                onClick={() => doc.drive_view_url && window.open(doc.drive_view_url, '_blank')}>
                <Download size={14} />
              </button>
              <button className="btn-ghost" title="מחיקה" onClick={() => handleDelete(doc.id)}
                style={{ color: '#e05c5c' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Upload card */}
        <div className={`card ${styles.uploadCard}`} onClick={() => fileRef.current?.click()}>
          <Upload size={28} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
          <span>העלאת מסמך חדש</span>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📂</div>
          <div>{filter === 'all' ? 'אין מסמכים — העלה מסמך ראשון' : 'אין מסמכים לתיק זה'}</div>
        </div>
      )}
    </div>
  );
}
