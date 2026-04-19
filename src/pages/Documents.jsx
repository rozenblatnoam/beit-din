import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, Filter, Download, Eye } from 'lucide-react';
import styles from './Documents.module.css';

export default function Documents() {
  const { docs, cases } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? docs : docs.filter(d => d.caseId === filter);

  return (
    <div className="page-content">
      <div className={styles.pageHeader}>
        <div className="section-title" style={{ margin: 0, flex: 1 }}>מסמכי התיקים</div>
        <div className={styles.headerActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">כל התיקים</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.id}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary">
            <Upload size={15} /> העלאת מסמך
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statPill}>{docs.length} מסמכים סה"כ</div>
        <div className={styles.statPill}>{cases.length} תיקים</div>
        <div className={styles.statPill}>מאובטח SSL 🔐</div>
      </div>

      <div className={styles.docsGrid}>
        {filtered.map(doc => (
          <div key={doc.id} className={`card ${styles.docCard}`}>
            <div className={styles.docIcon}>{doc.icon}</div>
            <div className={styles.docInfo}>
              <div className={styles.docName}>{doc.name}</div>
              <div className={styles.docCase}>תיק {doc.caseId}</div>
              <div className={styles.docMeta}>{doc.date} · {doc.size}</div>
            </div>
            <div className={styles.docActions}>
              <button className="btn-ghost" title="צפייה"><Eye size={14} /></button>
              <button className="btn-ghost" title="הורדה"><Download size={14} /></button>
            </div>
          </div>
        ))}

        {/* Upload card */}
        <div className={`card ${styles.uploadCard}`}>
          <Upload size={28} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
          <span>העלאת מסמך חדש</span>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📂</div>
          <div>אין מסמכים לתיק זה</div>
        </div>
      )}
    </div>
  );
}
