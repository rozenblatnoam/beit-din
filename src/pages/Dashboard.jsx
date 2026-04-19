import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, AlertTriangle, ChevronLeft } from 'lucide-react';
import styles from './Dashboard.module.css';

const statusMap = {
  open:    { label: 'פעיל',             cls: 'badge-open'    },
  pending: { label: 'ממתין לתגובה',     cls: 'badge-pending' },
  docs:    { label: 'השלמת מסמכים',    cls: 'badge-docs'    },
  closed:  { label: 'נסגר',             cls: 'badge-closed'  },
};

const timeline = [
  { text: 'קביעת דיון שני — תיק 2024-118', date: '15.04.2025 — 10:00', active: true },
  { text: 'הגשת כתב תגובה ע"י הנתבע', date: '02.04.2025', active: true },
  { text: 'ישיבה ראשונה בבית הדין', date: '10.03.2025', active: false },
  { text: 'שטר בוררות נחתם', date: '20.01.2025', active: false },
  { text: 'פתיחת תיק 2024-118', date: '12.01.2024', active: false },
];

export default function Dashboard() {
  const { user, cases, payments } = useApp();
  const navigate = useNavigate();

  const activeCases = cases.filter(c => c.status !== 'closed').length;
  const nextHearing = cases.find(c => c.nextHearing)?.nextHearing || '—';
  const totalDocs = cases.reduce((s, c) => s + c.docs, 0);
  const balance = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page-content">
      <div className={styles.dashHeader}>
        <div>
          <h2 className={styles.welcome}>שלום, <span>{user.name}</span></h2>
          <p className={styles.userId}>מספר לקוח: {user.id} | {user.email}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/new-case')}>
          <Plus size={16} /> פתיחת תיק חדש
        </button>
      </div>

      <div className="alert alert-warning">
        <AlertTriangle size={16} />
        <span><strong>תיק 2024-118</strong> — דרוש השלמת מסמכים עד 20.04.2025</span>
        <button className="btn-ghost" style={{ marginRight: 'auto', fontSize: '12px' }}
          onClick={() => navigate('/documents')}>
          לפרטים <ChevronLeft size={12} />
        </button>
      </div>

      {/* STATS */}
      <div className={styles.statsGrid}>
        {[
          { label: 'תיקים פעילים', value: activeCases, sub: `מתוך ${cases.length} סה"כ`, accent: true },
          { label: 'דיון קרוב', value: nextHearing, sub: 'תיק 2024-118', small: true },
          { label: 'מסמכים שהועלו', value: totalDocs, sub: `ב-${activeCases} תיקים` },
          { label: 'יתרה לתשלום', value: `₪${balance.toLocaleString()}`, sub: 'אגרת בית דין', accent: true },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={`${styles.statValue} ${s.accent ? styles.gold : ''} ${s.small ? styles.small : ''}`}>
              {s.value}
            </div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        {/* MAIN */}
        <div>
          {/* CASES TABLE */}
          <div className={`card ${styles.tableCard}`}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>התיקים שלי</span>
              <button className="btn-sm" onClick={() => navigate('/new-case')}>
                <Plus size={13} /> תיק חדש
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>מס׳ תיק</th>
                    <th>נושא</th>
                    <th>תאריך</th>
                    <th>סטטוס</th>
                    <th>דיין</th>
                    <th>פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.id}</strong></td>
                      <td>{c.subject}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{c.opened}</td>
                      <td>
                        <span className={`badge ${statusMap[c.status].cls}`}>
                          {statusMap[c.status].label}
                        </span>
                      </td>
                      <td>{c.dayan}</td>
                      <td>
                        <button className="btn-ghost" style={{ fontSize: '12px', color: 'var(--gold)' }}>
                          {c.status === 'closed' ? 'פסק דין' : 'פרטים'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENTS TABLE */}
          <div className={`card ${styles.tableCard}`} style={{ marginTop: '1rem' }}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>תשלומים אחרונים</span>
              <button className="btn-sm" onClick={() => navigate('/payment')}>לסליקה</button>
            </div>
            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr><th>תאריך</th><th>תיאור</th><th>תיק</th><th>סכום</th><th>סטטוס</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td>{p.desc}</td>
                      <td>{p.caseId}</td>
                      <td><strong>₪{p.amount.toLocaleString()}</strong></td>
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
        </div>

        {/* SIDEBAR */}
        <div>
          <div className={`card ${styles.sideWidget}`}>
            <div className={styles.widgetTitle}>⏱ ציר זמן — תיק 2024-118</div>
            {timeline.map((t, i) => (
              <div key={i} className={styles.timelineItem}>
                <div className={`${styles.dot} ${t.active ? styles.dotActive : ''}`} />
                <div>
                  <div className={styles.tlText}>{t.text}</div>
                  <div className={styles.tlDate}>{t.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={`card ${styles.sideWidget}`}>
            <div className={styles.widgetTitle}>📞 יצירת קשר</div>
            <div className={styles.contactList}>
              <div>📞 03-000-0000</div>
              <div>📧 info@karmei-mishpat.co.il</div>
              <div>🕘 א׳-ה׳ 09:00–18:00</div>
            </div>
            <button className="btn-sm" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
              שלח הודעה למזכירות
            </button>
          </div>

          <div className={`card ${styles.sideWidget}`}>
            <div className={styles.widgetTitle}>📋 סיכום תשלומים</div>
            <div className={styles.payRow}>
              <span style={{ color: 'var(--text-muted)' }}>שולם עד כה</span>
              <strong>₪{payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0).toLocaleString()}</strong>
            </div>
            <div className={styles.payRow} style={{ borderTop: '0.5px solid var(--border)', marginTop: '8px', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>יתרה לתשלום</span>
              <strong style={{ color: 'var(--gold)' }}>₪{balance.toLocaleString()}</strong>
            </div>
            <button className="btn-primary" onClick={() => navigate('/payment')}
              style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
              תשלום עכשיו
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
