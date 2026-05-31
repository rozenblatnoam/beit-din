import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import CaseTimeline from '../components/CaseTimeline';
import {
  ArrowRight, FolderOpen, FileText, Calendar, CreditCard,
  Download, Upload, Loader, AlertCircle,
} from 'lucide-react';
import styles from './CaseDetail.module.css';

const statusMap = {
  open:    { label: 'פעיל',           cls: 'badge-open'    },
  pending: { label: 'ממתין לתגובה',   cls: 'badge-pending' },
  docs:    { label: 'השלמת מסמכים',  cls: 'badge-docs'    },
  closed:  { label: 'נסגר',           cls: 'badge-closed'  },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmount(amount) {
  if (!amount) return '—';
  return `₪${Number(amount).toLocaleString()}`;
}

function fileIcon(type) {
  if (!type) return '📄';
  if (['jpg','jpeg','png','gif','webp'].includes(type)) return '🖼️';
  if (type === 'pdf') return '📋';
  if (['doc','docx'].includes(type)) return '📝';
  if (['mp3','wav','aac','ogg','m4a'].includes(type)) return '🎵';
  if (['mp4','webm','mov','avi'].includes(type)) return '🎬';
  return '📄';
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, payments } = useApp();

  const caseData = cases.find(c => c.id === Number(id));

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!id) return;
    setDocsLoading(true);
    api.get(`/documents/case/${id}`)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [id]);

  const casePayments = payments.filter(p => p.case_id === Number(id));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('case_id', id);
      fd.append('file', file);
      const doc = await api.uploadFile('/documents/', fd);
      setDocs(prev => [doc, ...prev]);
    } catch (err) {
      setUploadError(err?.detail || 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!caseData) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={40} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
        <h2>תיק לא נמצא</h2>
        <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ margin: '1rem auto', display: 'inline-flex' }}>
          חזרה לאזור האישי
        </button>
      </div>
    );
  }

  const status = statusMap[caseData.status] || { label: caseData.status, cls: '' };

  return (
    <div className="page-content">
      {/* BREADCRUMB */}
      <button className={styles.back} onClick={() => navigate('/dashboard')}>
        <ArrowRight size={15} /> חזרה לאזור האישי
      </button>

      {/* HEADER */}
      <div className={`card ${styles.header}`}>
        <div className={styles.headerRight}>
          <div className={styles.caseNumber}>{caseData.case_number}</div>
          <h2 className={styles.subject}>{caseData.subject}</h2>
          {caseData.description && <p className={styles.desc}>{caseData.description}</p>}
        </div>
        <div className={styles.headerLeft}>
          <span className={`badge ${status.cls}`} style={{ fontSize: '13px', padding: '5px 12px' }}>{status.label}</span>
        </div>
      </div>

      {/* STATS ROW */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <FolderOpen size={18} style={{ color: 'var(--gold)' }} />
          <div>
            <div className={styles.statLabel}>תאריך פתיחה</div>
            <div className={styles.statVal}>{formatDate(caseData.opened_at)}</div>
          </div>
        </div>
        <div className={styles.stat}>
          <CreditCard size={18} style={{ color: 'var(--gold)' }} />
          <div>
            <div className={styles.statLabel}>סכום תביעה</div>
            <div className={styles.statVal}>{formatAmount(caseData.amount)}</div>
          </div>
        </div>
        <div className={styles.stat}>
          <Calendar size={18} style={{ color: 'var(--gold)' }} />
          <div>
            <div className={styles.statLabel}>דיון קרוב</div>
            <div className={styles.statVal}>{formatDate(caseData.next_hearing)}</div>
          </div>
        </div>
        <div className={styles.stat}>
          <FileText size={18} style={{ color: 'var(--gold)' }} />
          <div>
            <div className={styles.statLabel}>מסמכים</div>
            <div className={styles.statVal}>{docs.length}</div>
          </div>
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* DOCUMENTS */}
        <div>
          <div className="card">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}><FileText size={16} /> מסמכים</span>
              <label className="btn-sm" style={{ cursor: 'pointer' }}>
                {uploading ? <Loader size={13} /> : <><Upload size={13} /> העלאה</>}
                <input type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.aac,.ogg,.m4a,.mp4,.webm,.mov,.avi" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            {uploadError && <div className="alert alert-warning" style={{ margin: '0.5rem 0' }}>{uploadError}</div>}
            {docsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><Loader size={20} /></div>
            ) : docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>אין מסמכים בתיק</div>
            ) : (
              <div className={styles.docList}>
                {docs.map(doc => (
                  <div key={doc.id} className={styles.docRow}>
                    <span className={styles.docIcon}>{fileIcon(doc.file_type)}</span>
                    <div className={styles.docInfo}>
                      <div className={styles.docName}>{doc.name}</div>
                      <div className={styles.docMeta}>{formatDate(doc.uploaded_at)}</div>
                    </div>
                    {doc.drive_view_url && (
                      <a href={doc.drive_view_url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: '12px' }}>
                        <Download size={13} /> פתח
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAYMENTS */}
          {casePayments.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}><CreditCard size={16} /> תשלומים</span>
              </div>
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead><tr><th>תאריך</th><th>תיאור</th><th>סכום</th><th>סטטוס</th></tr></thead>
                  <tbody>
                    {casePayments.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.created_at)}</td>
                        <td>{p.description || '—'}</td>
                        <td><strong>₪{Number(p.amount).toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge ${p.status === 'paid' ? 'badge-closed' : 'badge-pending'}`}>
                            {p.status === 'paid' ? 'שולם' : 'ממתין'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* TIMELINE */}
        <div className="card">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}><Calendar size={16} /> ציר זמן</span>
          </div>
          <CaseTimeline caseId={Number(id)} />
        </div>
      </div>
    </div>
  );
}
