import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, FileText, Upload, Trash2, ExternalLink, ArrowLeft, User, FolderOpen, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import styles from './LawyerPortal.module.css';

const statusMap = {
  open:    { label: 'פעיל',           cls: 'badge-open'    },
  pending: { label: 'ממתין לתגובה',   cls: 'badge-pending' },
  docs:    { label: 'השלמת מסמכים',  cls: 'badge-docs'    },
  closed:  { label: 'נסגר',           cls: 'badge-closed'  },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL');
}

function formatSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function LawyerPortal() {
  const { loggedLawyer } = useApp();
  const navigate = useNavigate();

  const [clientQ, setClientQ] = useState('');
  const [caseQ, setCaseQ] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  if (!loggedLawyer) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <Briefcase size={40} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
        <h2>אין גישה</h2>
        <p style={{ color: 'var(--text-muted)' }}>יש להתחבר תחילה כעו"ד/טו"ר</p>
        <button className="btn-primary" onClick={() => navigate('/lawyer')} style={{ margin: '1rem auto', display: 'inline-flex' }}>
          לעמוד הכניסה
        </button>
      </div>
    );
  }

  const search = async () => {
    setSearching(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (clientQ.trim()) params.append('client', clientQ.trim());
      if (caseQ.trim()) params.append('case_number', caseQ.trim());
      const data = await api.get(`/lawyer/search?${params.toString()}`);
      setResults(data);
      setSearched(true);
    } catch (e) {
      setError(e?.detail || 'שגיאה בחיפוש');
    } finally {
      setSearching(false);
    }
  };

  const openCase = async (c) => {
    setSelected(c);
    setLoadingDocs(true);
    try {
      const data = await api.get(`/lawyer/cases/${c.id}/documents`);
      setDocs(data);
    } catch (e) {
      setError(e?.detail || 'שגיאה בטעינת מסמכים');
    } finally {
      setLoadingDocs(false);
    }
  };

  const backToSearch = () => {
    setSelected(null);
    setDocs([]);
    setError('');
  };

  const handleFilePick = () => fileRef.current?.click();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const doc = await api.uploadFile(`/lawyer/cases/${selected.id}/documents`, form);
      setDocs((prev) => [doc, ...prev]);
      e.target.value = '';
    } catch (err) {
      setError(err?.detail || 'שגיאה בהעלאת קובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('האם למחוק את המסמך?')) return;
    try {
      await api.delete(`/lawyer/documents/${docId}`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (e) {
      setError(e?.detail || 'שגיאה במחיקה');
    }
  };

  return (
    <div className="page-content">
      <div className={styles.header}>
        <div className={styles.lawyerInfo}>
          <div className={styles.avatar}><Briefcase size={22} /></div>
          <div>
            <h2 className={styles.name}>{loggedLawyer.name}</h2>
            <p className={styles.role}>
              {loggedLawyer.role === 'toen' ? 'טוען רבני' : 'עורך דין'}
              {loggedLawyer.license_number && ` • רישיון ${loggedLawyer.license_number}`}
            </p>
          </div>
        </div>
      </div>

      {!selected ? (
        <>
          {/* SEARCH */}
          <div className={`card ${styles.searchCard}`}>
            <h3 className={styles.sectionTitle}><Search size={16} /> חיפוש תיקים</h3>
            <div className={styles.searchRow}>
              <div className={styles.searchField}>
                <label>שם הלקוח</label>
                <input
                  className={styles.searchInput}
                  value={clientQ}
                  onChange={(e) => setClientQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                  placeholder="לדוגמה: ישראל ישראלי"
                />
              </div>
              <div className={styles.searchField}>
                <label>מספר תיק</label>
                <input
                  className={styles.searchInput}
                  value={caseQ}
                  onChange={(e) => setCaseQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                  placeholder="לדוגמה: 2026-0042"
                  dir="ltr"
                />
              </div>
              <button className={styles.searchBtn} onClick={search} disabled={searching}>
                <Search size={14} /> {searching ? 'מחפש…' : 'חפש'}
              </button>
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}
            <p className={styles.hint}>ניתן לחפש לפי שם לקוח, מספר תיק, או שניהם. השאר ריק להצגת כל התיקים שלך.</p>
          </div>

          {/* RESULTS */}
          {searched && (
            <div className={styles.results}>
              {results.length === 0 ? (
                <div className={styles.empty}>
                  <FolderOpen size={32} />
                  <p>לא נמצאו תיקים</p>
                </div>
              ) : (
                <div className={`card ${styles.tableCard}`}>
                  <div className={styles.tableWrap}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>מס׳ תיק</th>
                          <th>נושא</th>
                          <th>לקוח</th>
                          <th>נפתח</th>
                          <th>סטטוס</th>
                          <th>סכום</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((c) => (
                          <tr key={c.id}>
                            <td><strong>{c.case_number}</strong></td>
                            <td>{c.subject}</td>
                            <td>{c.client_name || '—'}</td>
                            <td>{formatDate(c.opened_at)}</td>
                            <td><span className={`badge ${statusMap[c.status]?.cls || ''}`}>{statusMap[c.status]?.label || c.status}</span></td>
                            <td>{c.amount ? `₪${Number(c.amount).toLocaleString()}` : '—'}</td>
                            <td>
                              <button className={styles.openBtn} onClick={() => openCase(c)}>
                                <FileText size={13} /> מסמכים
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* CASE DETAIL + DOCS */}
          <button className={styles.backBtn} onClick={backToSearch}>
            <ArrowLeft size={14} /> חזרה לחיפוש
          </button>

          <div className={`card ${styles.caseCard}`}>
            <div className={styles.caseHeader}>
              <div>
                <div className={styles.caseNumber}>{selected.case_number}</div>
                <h3 className={styles.caseSubject}>{selected.subject}</h3>
              </div>
              <span className={`badge ${statusMap[selected.status]?.cls || ''}`}>{statusMap[selected.status]?.label || selected.status}</span>
            </div>
            <div className={styles.caseMeta}>
              <div><User size={13} /> {selected.client_name || '—'}</div>
              <div><Calendar size={13} /> נפתח: {formatDate(selected.opened_at)}</div>
              {selected.next_hearing && <div><Calendar size={13} /> דיון קרוב: {formatDate(selected.next_hearing)}</div>}
              {selected.amount && <div>סכום: ₪{Number(selected.amount).toLocaleString()}</div>}
            </div>
          </div>

          <div className={`card ${styles.docsCard}`}>
            <div className={styles.docsHeader}>
              <h3 className={styles.sectionTitle}><FileText size={16} /> מסמכים ({docs.length})</h3>
              <button className={styles.uploadBtn} onClick={handleFilePick} disabled={uploading}>
                <Upload size={14} /> {uploading ? 'מעלה…' : 'העלה מסמך'}
              </button>
              <input ref={fileRef} type="file" hidden onChange={handleUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}

            {loadingDocs ? (
              <div className={styles.empty}>טוען מסמכים...</div>
            ) : docs.length === 0 ? (
              <div className={styles.empty}>
                <FileText size={28} />
                <p>אין מסמכים בתיק זה</p>
              </div>
            ) : (
              <div className={styles.docsList}>
                {docs.map((d) => (
                  <div key={d.id} className={styles.docRow}>
                    <FileText size={16} className={styles.docIcon} />
                    <div className={styles.docMain}>
                      <div className={styles.docName}>{d.name}</div>
                      <div className={styles.docMeta}>
                        {d.file_type?.toUpperCase() || 'FILE'} • {formatSize(d.size_bytes)} • {formatDate(d.uploaded_at)}
                      </div>
                    </div>
                    <div className={styles.docActions}>
                      {d.drive_view_url && (
                        <a href={d.drive_view_url} target="_blank" rel="noreferrer" className={styles.docBtn} title="צפייה">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button className={styles.docBtn} onClick={() => handleDelete(d.id)} title="מחיקה">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
