import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, CreditCard, Building2, Smartphone, FileText, Loader } from 'lucide-react';
import styles from './Payment.module.css';

const payMethods = [
  { id: 'hyp',  icon: <CreditCard size={26} />, name: 'כרטיס אשראי', desc: 'דרך Hyp — מאובטח' },
  { id: 'bank', icon: <Building2 size={26} />,  name: 'העברה בנקאית', desc: 'פרטי חשבון יישלחו למייל' },
  { id: 'bit',  icon: <Smartphone size={26} />, name: 'Bit / PayBox',  desc: 'תשלום מהיר בנייד' },
  { id: 'check', icon: <FileText size={26} />,  name: 'שיק / מזומן',  desc: 'בתיאום עם המזכירות' },
];

const FEE_OPTIONS = [
  { label: 'אגרת פתיחת תיק', amount: 350 },
  { label: 'שכר דיין — ישיבה', amount: 700 },
  { label: 'אגרת בית דין', amount: 500 },
  { label: 'הוצאות מינהל', amount: 100 },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL');
}

export default function Payment() {
  const { cases, payments, createPayment } = useApp();
  const [method, setMethod] = useState('hyp');
  const [selectedCase, setSelectedCase] = useState(cases[0]?.id || '');
  const [feeIdx, setFeeIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState({ num: '', exp: '', cvv: '', name: '' });

  const activeCases = cases.filter(c => c.status !== 'closed');
  const fee = FEE_OPTIONS[feeIdx];
  const vat = Math.round(fee.amount * 0.17);
  const total = fee.amount + vat;

  const paidTotal = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  const handlePay = async () => {
    if (!selectedCase) { setError('יש לבחור תיק'); return; }
    if (method !== 'hyp') { setError('שיטת תשלום זו מחייבת תיאום ידני'); return; }
    setError('');
    setLoading(true);
    try {
      await createPayment(Number(selectedCase), total, fee.label);
    } catch (e) {
      setError(e?.detail || 'שגיאה בתשלום');
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="section-title">סליקה ותשלומים</div>

      <div className={styles.twoCol}>
        <div>
          <div className={`card ${styles.payCard}`}>
            <h3 className={styles.cardTitle}>בחירת תיק ופעולה</h3>
            <div className={styles.formRow}>
              <div className="form-group">
                <label>תיק לחיוב</label>
                <select value={selectedCase} onChange={e => setSelectedCase(e.target.value)}>
                  {activeCases.length === 0
                    ? <option value="">אין תיקים פעילים</option>
                    : activeCases.map(c => (
                      <option key={c.id} value={c.id}>{c.case_number} — {c.subject.slice(0, 25)}</option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group">
                <label>סוג תשלום</label>
                <select value={feeIdx} onChange={e => setFeeIdx(Number(e.target.value))}>
                  {FEE_OPTIONS.map((f, i) => <option key={i} value={i}>{f.label} — ₪{f.amount}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.feeSummary}>
              <div className={styles.feeRow}><span>{fee.label}</span><span>₪{fee.amount}</span></div>
              <div className={styles.feeRow}><span>מע"מ (17%)</span><span>₪{vat}</span></div>
              <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                <span>סה"כ לתשלום</span><strong>₪{total}</strong>
              </div>
            </div>
          </div>

          <div className={`card ${styles.payCard}`}>
            <h3 className={styles.cardTitle}>אמצעי תשלום</h3>
            <div className={styles.methodsGrid}>
              {payMethods.map(m => (
                <div key={m.id} className={`${styles.methodCard} ${method === m.id ? styles.methodSelected : ''}`}
                  onClick={() => setMethod(m.id)}>
                  <div className={styles.methodIcon}>{m.icon}</div>
                  <div className={styles.methodName}>{m.name}</div>
                  <div className={styles.methodDesc}>{m.desc}</div>
                </div>
              ))}
            </div>

            {method === 'hyp' && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <span>לחיצה על "בצע תשלום" תעביר אותך לדף סליקה מאובטח של Hyp</span>
              </div>
            )}

            {method === 'bank' && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <span>פרטי חשבון: בנק הפועלים, סניף 123, חשבון 456789. נא לציין את מספר התיק בהעברה.</span>
              </div>
            )}

            {method === 'bit' && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <span>שלחו תשלום לטלפון: 050-123-4567 עם הערה: מספר התיק שלך</span>
              </div>
            )}

            {method === 'check' && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <span>צרו קשר עם המזכירות לתיאום: 03-000-0000</span>
              </div>
            )}

            {error && <div className="alert alert-warning" style={{ marginTop: '1rem' }}>{error}</div>}

            <button className="btn-primary"
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
              onClick={handlePay} disabled={loading}>
              {loading ? <Loader size={16} className={styles.spin} /> : '🔒'}
              {loading ? ' מעבד...' : ` בצע תשלום — ₪${total}`}
            </button>
            <p className={styles.secureNote}>🔐 הצפנת SSL 256-bit | עמידה בתקן PCI DSS</p>
          </div>
        </div>

        {/* SIDEBAR */}
        <div>
          <div className={`card ${styles.sideWidget}`}>
            <div className={styles.widgetTitle}>📋 היסטוריית תשלומים</div>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', fontSize: '13px' }}>אין תשלומים עדיין</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>תאריך</th><th>תיאור</th><th>סכום</th><th>סטטוס</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                      <td style={{ fontSize: '12px' }}>{p.description || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>₪{Number(p.amount).toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${p.status === 'paid' ? 'badge-closed' : 'badge-pending'}`}>
                          {p.status === 'paid' ? 'שולם' : 'ממתין'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className={styles.payTotals}>
              <div className={styles.totalRow}><span>שולם עד כה</span><strong>₪{paidTotal.toLocaleString()}</strong></div>
              <div className={styles.totalRow} style={{ color: 'var(--gold)' }}>
                <span>יתרה לתשלום</span><strong>₪{pending.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div className={`card ${styles.sideWidget}`}>
            <div className={styles.widgetTitle}>ℹ️ תעריפי בית הדין</div>
            <div className={styles.rateList}>
              <div className={styles.rateRow}><span>אגרת פתיחת תיק</span><span>₪350</span></div>
              <div className={styles.rateRow}><span>שכר דיין לישיבה</span><span>₪700</span></div>
              <div className={styles.rateRow}><span>דיון בכתב</span><span>₪400</span></div>
              <div className={styles.rateRow}><span>ניסוח פסק דין</span><span>₪200</span></div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: '1.6' }}>
                עלות בית הדין מחולקת שווה בשווה בין הצדדים לפי הסכם הבוררות.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
