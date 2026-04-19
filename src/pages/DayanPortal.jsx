import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Calendar, Clock, CheckSquare, Square, Save, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './DayanPortal.module.css';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const TYPE_LABELS = { hearing: 'דיון', review: 'בדיקת מסמכים', consultation: 'ייעוץ' };
const TYPE_COLORS = { hearing: '#b4913c', review: '#4a9b7f', consultation: '#6b7fd4' };

export default function DayanPortal() {
  const { loggedDayan, cases, schedule, availability, updateAvailability } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('schedule');
  const [saved, setSaved] = useState(false);

  // If not logged in as dayan
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

  const myAvail = availability[loggedDayan.id] || { days: [], timeStart: '09:00', timeEnd: '17:00', notes: '' };
  const [localAvail, setLocalAvail] = useState({ ...myAvail });

  const myCases = cases.filter(c => c.dayanId === loggedDayan.id);
  const mySchedule = schedule.filter(s => s.dayanId === loggedDayan.id);

  const toggleDay = (d) => {
    setLocalAvail(prev => ({
      ...prev,
      days: prev.days.includes(d) ? prev.days.filter(x => x !== d) : [...prev.days, d]
    }));
  };

  const saveAvailability = () => {
    updateAvailability(loggedDayan.id, localAvail);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getCase = (caseId) => cases.find(c => c.id === caseId);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long' });
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.dayanInfo}>
          <div className={styles.avatar}>{loggedDayan.avatar}</div>
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

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'schedule', label: 'לוח ישיבות', icon: <Calendar size={15} /> },
          { id: 'cases', label: 'התיקים שלי', icon: <Gavel size={15} /> },
          { id: 'availability', label: 'זמינות', icon: <Clock size={15} /> },
        ].map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className={styles.panel}>
          {mySchedule.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={32} />
              <p>אין ישיבות מתוכננות</p>
            </div>
          ) : (
            <div className={styles.scheduleList}>
              {mySchedule.map(s => {
                const c = getCase(s.caseId);
                return (
                  <div key={s.id} className={styles.scheduleCard}>
                    <div
                      className={styles.scheduleType}
                      style={{ background: TYPE_COLORS[s.type] || '#b4913c' }}
                    >
                      {TYPE_LABELS[s.type] || s.type}
                    </div>
                    <div className={styles.scheduleMain}>
                      <div className={styles.scheduleLabel}>{s.label}</div>
                      <div className={styles.scheduleCase}>
                        תיק {s.caseId} — {c?.subject || '—'}
                      </div>
                    </div>
                    <div className={styles.scheduleMeta}>
                      <div className={styles.scheduleDate}>
                        <Calendar size={12} /> {formatDate(s.date)}
                      </div>
                      <div className={styles.scheduleTime}>
                        <Clock size={12} /> {s.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CASES TAB */}
      {activeTab === 'cases' && (
        <div className={styles.panel}>
          {myCases.length === 0 ? (
            <div className={styles.empty}>
              <Gavel size={32} />
              <p>אין תיקים משובצים</p>
            </div>
          ) : (
            <div className={`card ${styles.tableCard}`}>
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>מס׳ תיק</th>
                      <th>נושא</th>
                      <th>נפתח</th>
                      <th>סטטוס</th>
                      <th>סכום</th>
                      <th>דיון קרוב</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myCases.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        <td>{c.subject}</td>
                        <td>{c.opened}</td>
                        <td>
                          <span className={`badge badge-${c.status}`}>{c.statusLabel}</span>
                        </td>
                        <td>{c.amount}</td>
                        <td>{c.nextHearing || '—'}</td>
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
            <h3 className={styles.sectionTitle}>
              <Clock size={16} /> ימי זמינות
            </h3>
            <div className={styles.daysGrid}>
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  className={`${styles.dayBtn} ${localAvail.days.includes(i) ? styles.dayActive : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {localAvail.days.includes(i)
                    ? <CheckSquare size={14} />
                    : <Square size={14} />
                  }
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
                <select
                  className={styles.select}
                  value={localAvail.timeStart}
                  onChange={e => setLocalAvail(p => ({ ...p, timeStart: e.target.value }))}
                >
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className={styles.timeSep}>עד</div>
              <div className={styles.timeField}>
                <label>עד שעה</label>
                <select
                  className={styles.select}
                  value={localAvail.timeEnd}
                  onChange={e => setLocalAvail(p => ({ ...p, timeEnd: e.target.value }))}
                >
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.notesWrap}>
              <label className={styles.notesLabel}>הערות</label>
              <textarea
                className={styles.notes}
                rows={3}
                value={localAvail.notes}
                onChange={e => setLocalAvail(p => ({ ...p, notes: e.target.value }))}
                placeholder="למשל: בחגים לא זמין, עדיף בוקר..."
              />
            </div>

            <button className={styles.saveBtn} onClick={saveAvailability}>
              {saved
                ? <><CheckSquare size={15} /> נשמר בהצלחה!</>
                : <><Save size={15} /> שמור זמינות</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}