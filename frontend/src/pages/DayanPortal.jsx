import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Calendar, Clock, CheckSquare, Square, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import InboxWidget from '../components/InboxWidget';
import styles from './DayanPortal.module.css';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const TYPE_LABELS = { hearing: 'דיון', review: 'בדיקת מסמכים', consultation: 'ייעוץ' };
const TYPE_COLORS = { hearing: '#b4913c', review: '#4a9b7f', consultation: '#6b7fd4' };

const statusMap = {
  open:    { label: 'פעיל',           cls: 'badge-open'    },
  pending: { label: 'ממתין לתגובה',   cls: 'badge-pending' },
  docs:    { label: 'השלמת מסמכים',  cls: 'badge-docs'    },
  closed:  { label: 'נסגר',           cls: 'badge-closed'  },
};

function parseAvailDays(daysStr) {
  try { return JSON.parse(daysStr || '[]'); } catch { return []; }
}

export default function DayanPortal() {
  const { loggedDayan, schedule, loadDayanSchedule } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('schedule');
  const [saved, setSaved] = useState(false);
  const [myCases, setMyCases] = useState([]);
  const [avail, setAvail] = useState({ days: [], time_start: '09:00', time_end: '17:00', notes: '' });
  const [localAvail, setLocalAvail] = useState({ days: [], time_start: '09:00', time_end: '17:00', notes: '' });

  useEffect(() => {
    if (!loggedDayan) return;
    loadDayanSchedule().catch(() => {});
    api.get('/schedule/dayan/my/cases').then(setMyCases).catch(() => {});
    api.get('/schedule/dayan/my/availability').then(data => {
      const days = parseAvailDays(data.days);
      const a = { days, time_start: data.time_start || '09:00', time_end: data.time_end || '17:00', notes: data.notes || '' };
      setAvail(a);
      setLocalAvail(a);
    }).catch(() => {});
  }, [loggedDayan]);

  if (!loggedDayan) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <Gavel size={40} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
        <h2>אין גישה</h2>
        <p style={{ color: 'var(--text-muted)' }}>יש להתחבר תחילה כדיין</p>
        <button className="btn-primary" onClick={() => navigate('/dayan')} style={{ margin: '1rem auto', display: 'inline-flex' }}>
          לעמוד הכניסה
        </button>
      </div>
    );
  }

  const toggleDay = (d) => {
    setLocalAvail(prev => ({
      ...prev,
      days: prev.days.includes(d) ? prev.days.filter(x => x !== d) : [...prev.days, d],
    }));
  };

  const saveAvailability = async () => {
    try {
      await api.put('/schedule/availability', {
        days: localAvail.days,
        time_start: localAvail.time_start,
        time_end: localAvail.time_end,
        notes: localAvail.notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('שגיאה בשמירת זמינות', e);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long' });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('he-IL');
  };

  const mySchedule = schedule.filter(s => s.dayan_id === loggedDayan.id);

  return (
    <div className="page-content">
      <div className={styles.header}>
        <div className={styles.dayanInfo}>
          <div className={styles.avatar}>{loggedDayan.avatar || '⚖️'}</div>
          <div>
            <h2 className={styles.name}>{loggedDayan.name}</h2>
            <p className={styles.specialty}>{loggedDayan.specialty}</p>
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{myCases.length}</span>
            <span className={styles.statLabel}>תיקים</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{mySchedule.length}</span>
            <span className={styles.statLabel}>ישיבות קרובות</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{localAvail.days.length}</span>
            <span className={styles.statLabel}>ימי זמינות</span>
          </div>
        </div>
      </div>

      <InboxWidget />

      <div className={styles.tabs}>
        {[
          { id: 'schedule', label: 'לוח ישיבות', icon: <Calendar size={15} /> },
          { id: 'cases', label: 'התיקים שלי', icon: <Gavel size={15} /> },
          { id: 'availability', label: 'זמינות', icon: <Clock size={15} /> },
        ].map(t => (
          <button key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className={styles.panel}>
          {mySchedule.length === 0 ? (
            <div className={styles.empty}><Calendar size={32} /><p>אין ישיבות מתוכננות</p></div>
          ) : (
            <div className={styles.scheduleList}>
              {mySchedule.map(s => (
                <div key={s.id} className={styles.scheduleCard}>
                  <div className={styles.scheduleType} style={{ background: TYPE_COLORS[s.type] || '#b4913c' }}>
                    {TYPE_LABELS[s.type] || s.type}
                  </div>
                  <div className={styles.scheduleMain}>
                    <div className={styles.scheduleLabel}>{s.label}</div>
                    <div className={styles.scheduleCase}>תיק #{s.case_id}</div>
                  </div>
                  <div className={styles.scheduleMeta}>
                    <div className={styles.scheduleDate}><Calendar size={12} /> {formatDate(s.scheduled_at)}</div>
                    <div className={styles.scheduleTime}><Clock size={12} /> {formatTime(s.scheduled_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CASES TAB */}
      {activeTab === 'cases' && (
        <div className={styles.panel}>
          {myCases.length === 0 ? (
            <div className={styles.empty}><Gavel size={32} /><p>אין תיקים משובצים</p></div>
          ) : (
            <div className={`card ${styles.tableCard}`}>
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr><th>מס׳ תיק</th><th>נושא</th><th>נפתח</th><th>סטטוס</th><th>סכום</th><th>דיון קרוב</th></tr>
                  </thead>
                  <tbody>
                    {myCases.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.case_number}</strong></td>
                        <td>{c.subject}</td>
                        <td>{formatDateShort(c.opened_at)}</td>
                        <td>
                          <span className={`badge ${statusMap[c.status]?.cls}`}>{c.status_label}</span>
                        </td>
                        <td>{c.amount ? `₪${Number(c.amount).toLocaleString()}` : '—'}</td>
                        <td>{c.next_hearing ? formatDateShort(c.next_hearing) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {activeTab === 'availability' && (
        <div className={styles.panel}>
          <div className={`card ${styles.availCard}`}>
            <h3 className={styles.sectionTitle}><Clock size={16} /> ימי זמינות</h3>
            <div className={styles.daysGrid}>
              {DAYS.map((day, i) => (
                <button key={i}
                  className={`${styles.dayBtn} ${localAvail.days.includes(i) ? styles.dayActive : ''}`}
                  onClick={() => toggleDay(i)}>
                  {localAvail.days.includes(i) ? <CheckSquare size={14} /> : <Square size={14} />}
                  {day}
                </button>
              ))}
            </div>

            <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>
              <Clock size={16} /> שעות פעילות
            </h3>
            <div className={styles.timeRow}>
              <div className={styles.timeField}>
                <label>משעה</label>
                <select className={styles.select} value={localAvail.time_start}
                  onChange={e => setLocalAvail(p => ({ ...p, time_start: e.target.value }))}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className={styles.timeSep}>עד</div>
              <div className={styles.timeField}>
                <label>עד שעה</label>
                <select className={styles.select} value={localAvail.time_end}
                  onChange={e => setLocalAvail(p => ({ ...p, time_end: e.target.value }))}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.notesWrap}>
              <label className={styles.notesLabel}>הערות</label>
              <textarea className={styles.notes} rows={3} value={localAvail.notes}
                onChange={e => setLocalAvail(p => ({ ...p, notes: e.target.value }))}
                placeholder="למשל: בחגים לא זמין, עדיף בוקר..." />
            </div>

            <button className={styles.saveBtn} onClick={saveAvailability}>
              {saved ? <><CheckSquare size={15} /> נשמר בהצלחה!</> : <><Save size={15} /> שמור זמינות</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
