import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, ChevronLeft } from 'lucide-react';
import styles from './Dashboard.module.css';

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

function formatAmount(amount) {
  if (!amount) return '—';
  return `₪${Number(amount).toLocaleString()}`;
}

export default function Dashboard() {
  const { user, cases, payments } = useApp();
  const navigate = useNavigate();

  const activeCases = cases.filter(c => c.status !== 'closed').length;
  const nextHearingCase = cases.find(c => c.next_hearing);
  const nextHearing = nextHearingCase ? formatDate(nextHearingCase.next_hearing) : '—';
  const balance = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const paidTotal = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="page-content">
      <div className={styles.dashHeader}>
        <div>
          <h2 className={styles.welcome}>שלום, <span>{user?.name}</span></h2>
          <p className={styles.userId}>מספר לקוח: #{user?.id} | {user?.email}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/new-case')}>
          <Plus size={16} /> פתיחת תיק חדש
        </button>
      </div>

      {/* STATS */}
      <div className={styles.statsGrid}>
        {[
          { label: 'תיקים פעילים', value: activeCases, sub: `מתוך ${cases.length} סה"כ`, accent: true },
          { label: 'דיון קרוב', value: nextHearing, sub: nextHearingCase ? `תיק ${nextHearingCase.case_number}` : 'אין דיון קרוב', small: true },
          { label: 'חשבוניות בהמתנה', value: payments.filter(p => p.status === 'pending').length, sub: 'לתשלום' },
          { label: 'יתרה לתשלום', value: formatAmount(balance), sub: 'אגרת בית דין', accent: true },
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
            {cases.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>אין תיקים עדיין</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>מס׳ תיק</th>
                      <th>נושא</th>
                      <th>תאריך פתיחה</th>
                      <th>סטטוס</th>
                      <th>סכום</th>
                      <th>פעולה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.case_number}</strong></td>
                        <td>{c.subject}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(c.opened_at)}</td>
                        <td>
                          <span className={`badge ${statusMap[c.status]?.cls}`}>
                            {statusMap[c.status]?.label || c.status}
                          </span>
                        </td>
                        <td>{formatAmount(c.amount)}</td>
                        <td>
                          <button className="btn-ghost" style={{ fontSize: '12px', color: 'var(--gold)' }}
                            onClick={() => navigate('/documents')}>
                            {c.status === 'closed' ? 'פסק דין' : 'מסמכים'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PAYMENTS TABLE */}
          <div className={`card ${styles.tableCard}`} style={{ marginTop: '1rem' }}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>תשלומים אחרונים</span>
              <button className="btn-sm" onClick={() => navigate('/payment')}>לסליקה</button>
            </div>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>אין תשלומים עדיין</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr><th>תאריך</th><th>תיאור</th><th>תיק</th><th>סכום</th><th>סטטוס</th></tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.created_at)}</td>
                        <td>{p.description || '—'}</td>
                        <td>#{p.case_id}</td>
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
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div>
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
              <strong>₪{paidTotal.toLocaleString()}</strong>
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
