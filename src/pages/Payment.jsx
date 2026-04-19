import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, CreditCard, Building2, Smartphone, FileText } from 'lucide-react';
import styles from './Payment.module.css';

const payMethods = [
  { id: 'card', icon: <CreditCard size={26} />, name: 'כרטיס אשראי', desc: 'Visa, Mastercard, Amex' },
  { id: 'bank', icon: <Building2 size={26} />, name: 'העברה בנקאית', desc: 'פרטי חשבון יישלחו למייל' },
  { id: 'bit',  icon: <Smartphone size={26} />, name: 'Bit / PayBox', desc: 'תשלום מהיר בנייד' },
  { id: 'check', icon: <FileText size={26} />, name: 'שיק / מזומן', desc: 'בתיאום עם המזכירות' },
];

const paymentTypes = [
  'אגרת פתיחת תיק — ₪350',
  'שכר דיין — ישיבה שניה — ₪700',
  'אגרת בית דין — ₪500',
  'הוצאות מינהל — ₪100',
];

const installments = ['תשלום אחד', '2 תשלומים', '3 תשלומים'];

export default function Payment() {
  const { cases, payments } = useApp();
  const [method, setMethod] = useState('card');
  const [selectedCase, setSelectedCase] = useState('2024-118');
  const [payType, setPayType] = useState(0);
  const [paid, setPaid] = useState(false);
  const [card, setCard] = useState({ num: '', exp: '', cvv: '', name: '' });

  const paidTotal = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  if (paid) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ color: 'var(--gold-mid)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <CheckCircle size={64} strokeWidth={1} />
        </div>
        <h2 style={{ fontFamily: 'Frank Ruhl Libre', fontSize: '28px', marginBottom: '0.5rem' }}>התשלום בוצע בהצלחה!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>קבלה נשלחה לכתובת הדוא"ל שלכם</p>
        <button className="btn-primary" onClick={() => setPaid(false)}>חזרה לסליקה</button>
      </div>
    );
  }

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
                  {cases.filter(c => c.status !== 'closed').map(c => (
                    <option key={c.id} value={c.id}>{c.id} — {c.subject.split('—')[0].trim()}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>סוג תשלום</label>
                <select value={payType} onChange={e => setPayType(Number(e.target.value))}>
                  {paymentTypes.map((p, i) => <option key={i} value={i}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.feeSummary}>
              <div className={styles.feeRow}><span>שכר דיין — ישיבה שניה</span><span>₪700</span></div>
              <div className={styles.feeRow}><span>הוצאות מינהל</span><span>₪100</span></div>
              <div className={styles.feeRow}><span>מע"מ (17%)</span><span>₪50</span></div>
              <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                <span>סה"כ לתשלום</span><strong>₪850</strong>
              </div>
            </div>
          </div>

          <div className={`card ${styles.payCard}`}>
            <h3 className={styles.cardTitle}>אמצעי תשלום</h3>
            <div className={styles.methodsGrid}>
              {payMethods.map(m => (
                <div
                  key={m.id}
                  className={`${styles.methodCard} ${method === m.id ? styles.methodSelected : ''}`}
                  onClick={() => setMethod(m.id)}
                >
                  <div className={styles.methodIcon}>{m.icon}</div>
                  <div className={styles.methodName}>{m.name}</div>
                  <div className={styles.methodDesc}>{m.desc}</div>
                </div>
              ))}
            </div>

            {method === 'card' && (
              <div className={styles.cardForm}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>מספר כרטיס</label>
                  <input type="text" value={card.num}
                    onChange={e => setCard(c => ({ ...c, num: e.target.value }))}
                    placeholder="0000  0000  0000  0000" maxLength={19} />
                </div>
                <div className="form-group">
                  <label>תוקף</label>
                  <input type="text" value={card.exp}
                    onChange={e => setCard(c => ({ ...c, exp: e.target.value }))}
                    placeholder="MM/YY" maxLength={5} />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" value={card.cvv}
                    onChange={e => setCard(c => ({ ...c, cvv: e.target.value }))}
                    placeholder="000" maxLength={4} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>שם בעל הכרטיס</label>
                  <input type="text" value={card.name}
                    onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                    placeholder="כפי שמופיע על הכרטיס" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>תשלומים</label>
                  <select>
                    {installments.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            )}

            {method === 'bank' && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <span>פרטי חשבון: בנק הפועלים, סניף 123, חשבון 456789. נא לציין את מספר התיק בהעברה.</span>
              </div>
            )}

            {method === 'bit' && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <span>שלחו תשלום לטלפון: 050-123-4567 עם הערה: מספר תיק {selectedCase}</span>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
              onClick={() => setPaid(true)}
            >
              🔒 בצע תשלום — ₪850
            </button>
            <p className={styles.secureNote}>🔐 הצפנת SSL 256-bit | עמידה בתקן PCI DSS</p>
          </div>
        </div>

        {/* SIDEBAR */}
        <div>
          <div className={`card ${styles.sideWidget}`}>
            <div className={styles.widgetTitle}>📋 היסטוריית תשלומים</div>
            <table className="data-table">
              <thead>
                <tr><th>תאריך</th><th>תיאור</th><th>סכום</th><th>סטטוס</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.date}</td>
                    <td style={{ fontSize: '12px' }}>{p.desc}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><strong>₪{p.amount.toLocaleString()}</strong></td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-closed' : 'badge-pending'}`}>
                        {p.status === 'paid' ? 'שולם' : 'ממתין'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
