import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Calendar, Plus, Trash2, CalendarPlus, ChevronDown, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import styles from './AdminScheduler.module.css';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const TYPE_OPTIONS = [
  { value: 'hearing', label: 'דיון' },
  { value: 'review', label: 'בדיקת מסמכים' },
  { value: 'consultation', label: 'ייעוץ' },
];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

const statusMap = {
  open:    { label: 'פעיל',           cls: 'badge-open'    },
  pending: { label: 'ממתין לתגובה',   cls: 'badge-pending' },
  docs:    { label: 'השלמת מסמכים',  cls: 'badge-docs'    },
  closed:  { label: 'נסגר',           cls: 'badge-closed'  },
};

function formatAmount(amount) {
  if (!amount) return '—';
  return `₪${Number(amount).toLocaleString()}`;
}

function toISODateTime(date, time) {
  return `${date}T${time}:00`;
}

export default function AdminScheduler() {
  const { isAdmin, cases, schedule, refreshCases, addScheduleItem, removeScheduleItem } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('assign');
  const [dayans, setDayans] = useState([]);
  const [availabilities, setAvailabilities] = useState({});
  const [newItem, setNewItem] = useState({ case_id: '', dayan_id: '', date: '', time: '10:00', type: 'hearing', label: '' });
  const [added, setAdded] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [dateWarning, setDateWarning] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/admin/dayans').then(setDayans).catch(() => {});
    api.get('/admin/cases').then(() => {}).catch(() => {});
    refreshCases && refreshCases();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || dayans.length === 0) return;
    dayans.forEach(d => {
      api.get(`/schedule/availability/${d.id}`)
        .then(avail => setAvailabilities(prev => ({ ...prev, [d.id]: avail })))
        .catch(() => {});
    });
  }, [dayans, isAdmin]);

  useEffect(() => {
    if (!newItem.date) { setDateWarning(''); return; }
    const iso = toISODateTime(newItem.date, newItem.time || '10:00');
    api.get(`/schedule/check-date?date=${encodeURIComponent(iso)}`)
      .then((r) => setDateWarning(r.blocked || ''))
      .catch(() => setDateWarning(''));
  }, [newItem.date, newItem.time]);

  if (!isAdmin) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <ShieldCheck size={40} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
        <h2>אין גישה</h2>
        <p style={{ color: 'var(--text-muted)' }}>דף זה מיועד למנהלי בית הדין בלבד</p>
        <button className="btn-primary" onClick={() => navigate('/dayan')} style={{ margin: '1rem auto', display: 'inline-flex' }}>
          לעמוד הכניסה
        </button>
      </div>
    );
  }

  const unassignedCases = cases.filter(c => !c.dayan_id && c.status !== 'closed');
  const assignedCases = cases.filter(c => c.dayan_id);

  const handleAssign = async (caseId, dayanId) => {
    if (!dayanId) return;
    try {
      await api.patch(`/admin/cases/${caseId}`, { dayan_id: Number(dayanId) });
      refreshCases && refreshCases();
    } catch (e) {
      console.error('שגיאה בשיבוץ', e);
    }
  };

  const handleAddSchedule = async (force = false) => {
    if (!newItem.case_id || !newItem.dayan_id || !newItem.date || !newItem.label) return;
    setLoadingSchedule(true);
    setScheduleError('');
    try {
      const path = force ? '/schedule/?force=true' : '/schedule/';
      const created = await api.post(path, {
        case_id: Number(newItem.case_id),
        dayan_id: Number(newItem.dayan_id),
        scheduled_at: toISODateTime(newItem.date, newItem.time),
        type: newItem.type,
        label: newItem.label,
      });
      setAdded(true);
      setNewItem({ case_id: '', dayan_id: '', date: '', time: '10:00', type: 'hearing', label: '' });
      setDateWarning('');
      setTimeout(() => setAdded(false), 2000);
      // best-effort refresh
      refreshCases && refreshCases();
    } catch (e) {
      setScheduleError(e?.detail || 'שגיאה בהוספת ישיבה');
      console.error('שגיאה בהוספת ישיבה', e);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const getDayan = (id) => dayans.find(d => d.id === id);
  const getCase = (id) => cases.find(c => c.id === id);

  const dayanAvailDays = (dayanId) => {
    const avail = availabilities[dayanId];
    if (!avail) return 'לא הוגדרה';
    let days = [];
    try { days = JSON.parse(avail.days || '[]'); } catch {}
    if (!days.length) return 'לא הוגדרה';
    return days.map(d => DAYS_HE[d]).join(', ') + ` | ${avail.time_start}–${avail.time_end}`;
  };

  const formatScheduledAt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatScheduledTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-content">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.adminBadge}><ShieldCheck size={18} /><span>פאנל מנהל</span></div>
          <h2 className={styles.title}>מערכת שיבוץ דיינים</h2>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.hStat}>
            <span className={styles.hNum}>{unassignedCases.length}</span>
            <span className={styles.hLbl}>תיקים ללא דיין</span>
          </div>
          <div className={styles.hStat}>
            <span className={styles.hNum}>{schedule.length}</span>
            <span className={styles.hLbl}>ישיבות מתוכננות</span>
          </div>
          <div className={styles.hStat}>
            <span className={styles.hNum}>{dayans.length}</span>
            <span className={styles.hLbl}>דיינים פעילים</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {[
          { id: 'assign', label: 'שיבוץ דיין לתיק', icon: <UserCheck size={15} /> },
          { id: 'schedule', label: 'תזמון ישיבות', icon: <CalendarPlus size={15} /> },
          { id: 'overview', label: 'סקירת דיינים', icon: <Calendar size={15} /> },
        ].map(t => (
          <button key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ASSIGN TAB */}
      {activeTab === 'assign' && (
        <div className={styles.panel}>
          {unassignedCases.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.dot} style={{ background: '#e05c5c' }} />
                תיקים ממתינים לשיבוץ ({unassignedCases.length})
              </h3>
              <div className={styles.caseList}>
                {unassignedCases.map(c => (
                  <div key={c.id} className={`${styles.caseRow} ${styles.caseUnassigned}`}>
                    <div className={styles.caseInfo}>
                      <strong>{c.case_number}</strong>
                      <span>{c.subject}</span>
                      <span className={`badge ${statusMap[c.status]?.cls}`}>{statusMap[c.status]?.label}</span>
                      <span className={styles.amount}>{formatAmount(c.amount)}</span>
                    </div>
                    <div className={styles.assignControl}>
                      <div className={styles.selectWrap}>
                        <select className={styles.select} defaultValue=""
                          onChange={e => handleAssign(c.id, e.target.value)}>
                          <option value="" disabled>בחר דיין...</option>
                          {dayans.map(d => (
                            <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className={styles.selectArrow} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: '#4a9b7f' }} />
              תיקים משובצים ({assignedCases.length})
            </h3>
            <div className={`card ${styles.tableCard}`}>
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr><th>תיק</th><th>נושא</th><th>סטטוס</th><th>דיין משובץ</th><th>שינוי שיבוץ</th></tr>
                  </thead>
                  <tbody>
                    {assignedCases.map(c => {
                      const dayan = getDayan(c.dayan_id);
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.case_number}</strong></td>
                          <td>{c.subject}</td>
                          <td><span className={`badge ${statusMap[c.status]?.cls}`}>{statusMap[c.status]?.label}</span></td>
                          <td><span className={styles.dayanChip}>{dayan?.avatar} {dayan?.name || `#${c.dayan_id}`}</span></td>
                          <td>
                            <div className={styles.selectWrap} style={{ minWidth: '160px' }}>
                              <select className={styles.select} value={c.dayan_id || ''}
                                onChange={e => handleAssign(c.id, e.target.value)}>
                                {dayans.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                              <ChevronDown size={13} className={styles.selectArrow} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className={styles.panel}>
          <div className={`card ${styles.addCard}`}>
            <h3 className={styles.sectionTitle}><Plus size={15} /> תזמון ישיבה חדשה</h3>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>תיק</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={newItem.case_id}
                    onChange={e => setNewItem(p => ({ ...p, case_id: e.target.value }))}>
                    <option value="">בחר תיק...</option>
                    {cases.filter(c => c.status !== 'closed').map(c => (
                      <option key={c.id} value={c.id}>{c.case_number} — {c.subject}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className={styles.selectArrow} />
                </div>
              </div>
              <div className={styles.formField}>
                <label>דיין</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={newItem.dayan_id}
                    onChange={e => setNewItem(p => ({ ...p, dayan_id: e.target.value }))}>
                    <option value="">בחר דיין...</option>
                    {dayans.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={13} className={styles.selectArrow} />
                </div>
              </div>
              <div className={styles.formField}>
                <label>תאריך</label>
                <input type="date" className={styles.input} value={newItem.date}
                  onChange={e => setNewItem(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className={styles.formField}>
                <label>שעה</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={newItem.time}
                    onChange={e => setNewItem(p => ({ ...p, time: e.target.value }))}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <ChevronDown size={13} className={styles.selectArrow} />
                </div>
              </div>
              <div className={styles.formField}>
                <label>סוג</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={newItem.type}
                    onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={13} className={styles.selectArrow} />
                </div>
              </div>
              <div className={styles.formField}>
                <label>תיאור</label>
                <input type="text" className={styles.input} value={newItem.label}
                  placeholder="למשל: דיון ראשון..."
                  onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))} />
              </div>
            </div>
            {dateWarning && (
              <div className={styles.warning}>
                ⚠️ התאריך הנבחר הוא {dateWarning}. ניתן בכל זאת לשבץ אם תאשר.
              </div>
            )}
            {scheduleError && (
              <div className={styles.warning} style={{ background: '#fee', borderColor: '#fcc', color: '#c33' }}>
                {scheduleError}
              </div>
            )}
            <button className={styles.addBtn} onClick={() => handleAddSchedule(!!dateWarning)} disabled={loadingSchedule}>
              {added ? '✓ נוסף בהצלחה!' : loadingSchedule
                ? <Loader size={14} />
                : <><CalendarPlus size={14} /> {dateWarning ? 'שבץ בכל זאת' : 'הוסף ישיבה'}</>}
            </button>
          </div>

          <div className={styles.section} style={{ marginTop: '1.5rem' }}>
            <h3 className={styles.sectionTitle}><Calendar size={15} /> ישיבות מתוכננות ({schedule.length})</h3>
            {schedule.length === 0 ? (
              <div className={styles.empty}>אין ישיבות מתוכננות</div>
            ) : (
              <div className={styles.schedList}>
                {schedule.map(s => {
                  const dayan = getDayan(s.dayan_id);
                  const cas = getCase(s.case_id);
                  return (
                    <div key={s.id} className={styles.schedRow}>
                      <div className={styles.schedLeft}>
                        <span className={styles.schedType}>
                          {TYPE_OPTIONS.find(t => t.value === s.type)?.label || s.type}
                        </span>
                        <div className={styles.schedLabel}>{s.label}</div>
                        <div className={styles.schedMeta}>
                          תיק {cas?.case_number || s.case_id} · {cas?.subject} · {dayan?.name}
                        </div>
                      </div>
                      <div className={styles.schedRight}>
                        <div className={styles.schedDate}>
                          <Calendar size={11} /> {formatScheduledAt(s.scheduled_at)}
                        </div>
                        <div className={styles.schedTime}>{formatScheduledTime(s.scheduled_at)}</div>
                        <button className={styles.delBtn} onClick={() => removeScheduleItem(s.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className={styles.panel}>
          <div className={styles.dayanGrid}>
            {dayans.map(d => {
              const myCases = cases.filter(c => c.dayan_id === d.id);
              const mySessions = schedule.filter(s => s.dayan_id === d.id);
              return (
                <div key={d.id} className={`card ${styles.dayanCard}`}>
                  <div className={styles.dcHeader}>
                    <div className={styles.dcAvatar}>{d.avatar || '⚖️'}</div>
                    <div>
                      <div className={styles.dcName}>{d.name}</div>
                      <div className={styles.dcSpec}>{d.specialty}</div>
                    </div>
                  </div>
                  <div className={styles.dcStats}>
                    <div className={styles.dcStat}>
                      <span className={styles.dcNum}>{myCases.length}</span><span>תיקים</span>
                    </div>
                    <div className={styles.dcStat}>
                      <span className={styles.dcNum}>{mySessions.length}</span><span>ישיבות</span>
                    </div>
                  </div>
                  <div className={styles.dcAvailRow}>
                    <Calendar size={12} />
                    <span>{dayanAvailDays(d.id)}</span>
                  </div>
                  {myCases.length > 0 && (
                    <div className={styles.dcCases}>
                      {myCases.map(c => (
                        <div key={c.id} className={styles.dcCaseChip}>{c.case_number}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
