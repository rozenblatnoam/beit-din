import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CheckCircle, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './NewCase.module.css';

const steps = ['פרטים אישיים', 'פרטי התביעה', 'מסמכים', 'תשלום ואישור'];

const caseTypes = [
  'חוב כספי', 'שותפות עסקית', 'סכסוך שכנים', 'ירושה וצוואה',
  'שכירות ונדל"ן', 'חוזה ועסקה', 'עבודה ושכר', 'אחר',
];

export default function NewCase() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    // Step 0
    claimantName: 'ישראל ישראלי', claimantId: '', claimantPhone: '', claimantEmail: '',
    // Step 1
    respondentName: '', respondentId: '', respondentPhone: '', respondentEmail: '',
    caseType: '', amount: '', description: '', relief: '',
    // Step 2
    files: [],
    // Step 3
    agree: false,
  });
  const { addCase, user } = useApp();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).map(f => f.name);
    setForm(f => ({ ...f, files: [...f.files, ...selected] }));
  };

  const handleSubmit = () => {
    const newCase = {
      id: `2025-${Math.floor(Math.random() * 900) + 100}`,
      subject: `${form.caseType} — ${form.respondentName || 'נתבע'}`,
      opened: new Date().toLocaleDateString('he-IL'),
      status: 'pending',
      dayan: 'ממתין לשיבוץ',
      amount: form.amount ? `₪${Number(form.amount).toLocaleString()}` : '—',
      nextHearing: null,
      docs: form.files.length,
    };
    addCase(newCase);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className={styles.successIcon}><CheckCircle size={64} strokeWidth={1} /></div>
        <h2 style={{ fontFamily: 'Frank Ruhl Libre', fontSize: '28px', margin: '1rem 0 0.5rem' }}>
          התיק נפתח בהצלחה!
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 2rem' }}>
          תקבל אישור למייל תוך 24 שעות. נציג בית הדין יצור קשר לתיאום שטר בוררות.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>לאזור האישי</button>
          <button className="btn-outline" onClick={() => navigate('/payment')}>לתשלום אגרה</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="section-title">פתיחת תיק דיגיטלי</div>

      {/* STEP INDICATOR */}
      <div className={styles.stepBar}>
        {steps.map((s, i) => (
          <div
            key={i}
            className={`${styles.stepItem} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}
            onClick={() => i < step && setStep(i)}
          >
            <div className={styles.stepNum}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* STEP 0 */}
      {step === 0 && (
        <div className={`card ${styles.formCard}`}>
          <h3 className={styles.formTitle}>פרטי התובע</h3>
          <div className={styles.formGrid}>
            <div className="form-group">
              <label>שם מלא</label>
              <input type="text" value={form.claimantName} onChange={e => update('claimantName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>מספר ת.ז. / ח.פ.</label>
              <input type="text" value={form.claimantId} onChange={e => update('claimantId', e.target.value)} placeholder="000000000" />
            </div>
            <div className="form-group">
              <label>טלפון</label>
              <input type="tel" value={form.claimantPhone} onChange={e => update('claimantPhone', e.target.value)} placeholder="050-0000000" />
            </div>
            <div className="form-group">
              <label>דוא"ל</label>
              <input type="email" value={form.claimantEmail} onChange={e => update('claimantEmail', e.target.value)} placeholder="example@email.com" />
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className={`card ${styles.formCard}`}>
          <h3 className={styles.formTitle}>פרטי הנתבע ומהות הסכסוך</h3>
          <div className={styles.formGrid}>
            <div className="form-group">
              <label>שם הנתבע</label>
              <input type="text" value={form.respondentName} onChange={e => update('respondentName', e.target.value)} placeholder="שם מלא" />
            </div>
            <div className="form-group">
              <label>ת.ז. / ח.פ. נתבע</label>
              <input type="text" value={form.respondentId} onChange={e => update('respondentId', e.target.value)} placeholder="000000000" />
            </div>
            <div className="form-group">
              <label>טלפון נתבע</label>
              <input type="tel" value={form.respondentPhone} onChange={e => update('respondentPhone', e.target.value)} placeholder="050-0000000" />
            </div>
            <div className="form-group">
              <label>אימייל נתבע</label>
              <input type="email" value={form.respondentEmail} onChange={e => update('respondentEmail', e.target.value)} placeholder="example@email.com" />
            </div>
            <div className="form-group">
              <label>סוג הסכסוך</label>
              <select value={form.caseType} onChange={e => update('caseType', e.target.value)}>
                <option value="">-- בחרו סוג --</option>
                {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>סכום התביעה (₪)</label>
              <input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="לדוגמה: 50000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>תיאור הסכסוך</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="פרטו את עיקרי הטענות והמחלוקת..." />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>הסעד המבוקש</label>
              <textarea value={form.relief} onChange={e => update('relief', e.target.value)} placeholder="מה אתם מבקשים מבית הדין?" style={{ minHeight: '70px' }} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className={`card ${styles.formCard}`}>
          <h3 className={styles.formTitle}>העלאת מסמכים</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            ניתן להעלות חוזים, קבלות, תמונות, חוות דעת — כל מסמך רלוונטי לתיק
          </p>
          <label className={styles.uploadArea}>
            <input type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
            <Upload size={36} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
            <div className={styles.uploadText}>גרור קבצים לכאן או לחץ לבחירה</div>
            <div className={styles.uploadSub}>PDF, DOCX, JPG, PNG — עד 10MB לקובץ</div>
          </label>

          {form.files.length > 0 && (
            <div className={styles.fileList}>
              {form.files.map((f, i) => (
                <div key={i} className={styles.fileItem}>
                  <span>📄 {f}</span>
                  <button className="btn-ghost" style={{ fontSize: '12px' }}
                    onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, j) => j !== i) }))}>
                    הסר
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className={`card ${styles.formCard}`}>
          <h3 className={styles.formTitle}>סיכום ואישור</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>תובע</div>
              <div className={styles.summaryValue}>{form.claimantName || '—'}</div>
            </div>
            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>נתבע</div>
              <div className={styles.summaryValue}>{form.respondentName || '—'}</div>
            </div>
            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>סוג סכסוך</div>
              <div className={styles.summaryValue}>{form.caseType || '—'}</div>
            </div>
            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>סכום תביעה</div>
              <div className={styles.summaryValue}>
                {form.amount ? `₪${Number(form.amount).toLocaleString()}` : '—'}
              </div>
            </div>
            <div className={styles.summarySection} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.summaryLabel}>מסמכים שהועלו</div>
              <div className={styles.summaryValue}>{form.files.length} קבצים</div>
            </div>
          </div>

          <div className={styles.feeBox}>
            <div className={styles.feeRow}><span>אגרת פתיחת תיק</span><span>₪350</span></div>
            <div className={styles.feeRow}><span>מע"מ (17%)</span><span>₪59.50</span></div>
            <div className={`${styles.feeRow} ${styles.feeTotal}`}><span>סה"כ לתשלום עכשיו</span><strong>₪409.50</strong></div>
          </div>

          <label className={styles.agreeRow}>
            <input type="checkbox" checked={form.agree} onChange={e => update('agree', e.target.checked)} />
            <span>אני מאשר/ת את תנאי הגשת התיק ומסכים/ה לכללי בית הדין 'כרמי המשפט'</span>
          </label>
        </div>
      )}

      {/* ACTIONS */}
      <div className={styles.formActions}>
        {step > 0 && (
          <button className="btn-outline" onClick={() => setStep(s => s - 1)}>
            <ChevronRight size={16} /> חזרה
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn-ghost" onClick={() => {}}>שמירה כטיוטה</button>
        {step < 3 ? (
          <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
            המשך <ChevronLeft size={16} />
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={!form.agree}
            style={{ opacity: form.agree ? 1 : 0.5 }}
            onClick={handleSubmit}
          >
            🔒 פתיחת תיק ותשלום
          </button>
        )}
      </div>
    </div>
  );
}
