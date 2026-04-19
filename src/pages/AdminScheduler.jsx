import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Calendar, Plus, Trash2, CalendarPlus, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './AdminScheduler.module.css';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const TYPE_OPTIONS = [
  { value: 'hearing', label: 'דיון' },
  { value: 'review', label: 'בדיקת מסמכים' },
  { value: 'consultation', label: 'ייעוץ' },
];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

export default function AdminScheduler() {
  const { isAdmin, cases, dayans, schedule, availability, assignDayan, addScheduleItem, removeScheduleItem } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('assign');
  const [newItem, setNewItem] = useState({ caseId: '', dayanId: '', date: '', time: '10:00', type: 'hearing', label: '' });
  const [added, setAdded] = useState(false);

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

  const unassignedCases = cases.filter(c => !c.dayanId && c.status !== 'closed');
  const assignedCases = cases.filter(c => c.dayanId);

  const handleAssign = (caseId, dayanId) => {
    if (dayanId) assignDayan(caseId, dayanId);
  };

  const handleAddSchedule = () => {
    if (!newItem.caseId || !newItem.dayanId || !newItem.date || !newItem.label) return;
    addScheduleItem(newItem);
    setAdded(true);
    setNewItem({ caseId: '', dayanId: '', date: '', time: '10:00', type: 'hearing', label: '' });
    setTimeout(() => setAdded(false), 2000);
  };

  const getDayan = (id) => dayans.find(d => d.id === id);
  const getCase = (id) => cases.find(c => c.id === id);

  const dayanAvailDays = (dayanId) => {
    const avail = availability[dayanId];
    if (!avail || !avail.days.length) return 'לא הוגדרה';
    return avail.days.map(d => DAYS_HE[d]).join(', ') + ` | ${avail.timeStart}–${avail.timeEnd}`;
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.adminBadge}>
            <ShieldCheck size={18} />
            <span>פאנל מנהל</span>
          </div>
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

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'assign', label: 'שיבוץ דיין לתיק', icon: <UserCheck size={15} /> },
          { id: 'schedule', label: 'תזמון ישיבות', icon: <CalendarPlus size={15} /> },
          { id: 'overview', label: 'סקירת דיינים', icon: <Calendar size={15} /> },
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
                      <strong>{c.id}</strong>
                      <span>{c.subject}</span>
                      <span className={`badge badge-${c.status}`}>{c.statusLabel}</span>
                      <span className={styles.amount}>{c.amount}</span>
                    </div>
                    <div className={styles.assignControl}>
                      <div className={styles.selectWrap}>
                        <select
                          className={styles.select}
                          defaultValue=""
                          onChange={e => handleAssign(c.id, e.target.value)}
                        >
                          <option value="" disabled>בחר דיין...</option>
                          {dayans.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} — {d.specialty}
                            </option>
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
                    <tr>
                      <th>תיק</th>
                      <th>נושא</th>
                      <th>סטטוס</th>
                      <th>דיין משובץ</th>
                      <th>שינוי שיבוץ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedCases.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        <td>{c.subject}</td>
                        <td><span className={`badge badge-${c.status}`}>{c.statusLabel}</span></td>
                        <td>
                          <span className={styles.dayanChip}>
                            {getDayan(c.dayanId)?.avatar} {c.dayan}
                          </span>
                        </td>
                        <td>
                          <div className={styles.selectWrap} style={{ minWidth: '160px' }}>
                            <select
                              className={styles.select}
                              value={c.dayanId}
                              onChange={e => handleAssign(c.id, e.target.value)}
                            >
                              {dayans.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={13} className={styles.selectArrow} />
                          </div>
                        </td>
                      </tr>
                    ))}
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
          {/* Add new */}
          <div className={`card ${styles.addCard}`}>
            <h3 className={styles.sectionTitle}>
              <Plus size={15} /> תזמון ישיבה חדשה
            </h3>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>תיק</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={newItem.caseId}
                    onChange={e => setNewItem(p => ({ ...p, caseId: e.target.value }))}>
                    <option value="">בחר תיק...</option>
                    {cases.filter(c => c.status !== 'closed').map(c => (
                      <option key={c.id} value={c.id}>{c.id} — {c.subject}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className={styles.selectArrow} />
                </div>
              </div>
              <div className={styles.formField}>
                <label>דיין</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={newItem.dayanId}
                    onChange={e => setNewItem(p => ({ ...p, dayanId: e.target.value }))}>
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
            <button className={styles.addBtn} onClick={handleAddSchedule}>
              {added
                ? '✓ נוסף בהצלחה!'
                : <><CalendarPlus size={14} /> הוסף ישיבה</>
              }
            </button>
          </div>

          {/* Existing schedule */}
          <div className={styles.section} style={{ marginTop: '1.5rem' }}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={15} /> ישיבות מתוכננות ({schedule.length})
            </h3>
            {schedule.length === 0 ? (
              <div className={styles.empty}>אין ישיבות מתוכננות</div>
            ) : (
              <div className={styles.schedList}>
                {schedule.map(s => {
                  const dayan = getDayan(s.dayanId);
                  const cas = getCase(s.caseId);
                  return (
                    <div key={s.id} className={styles.schedRow}>
                      <div className={styles.schedLeft}>
                        <span className={styles.schedType}>
                          {TYPE_OPTIONS.find(t => t.value === s.type)?.label || s.type}
                        </span>
                        <div className={styles.schedLabel}>{s.label}</div>
                        <div className={styles.schedMeta}>
                          תיק {s.caseId} · {cas?.subject} · {dayan?.avatar} {dayan?.short}
                        </div>
                      </div>
                      <div className={styles.schedRight}>
                        <div className={styles.schedDate}>
                          <Calendar size={11} />
                          {new Date(s.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className={styles.schedTime}>{s.time}</div>
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
              const myCases = cases.filter(c => c.dayanId === d.id);
              const mySessions = schedule.filter(s => s.dayanId === d.id);
              const avail = availability[d.id];
              return (
                <div key={d.id} className={`card ${styles.dayanCard}`}>
                  <div className={styles.dcHeader}>
                    <div className={styles.dcAvatar}>{d.avatar}</div>
                    <div>
                      <div className={styles.dcName}>{d.name}</div>
                      <div className={styles.dcSpec}>{d.specialty}</div>
                    </div>
                  </div>
                  <div className={styles.dcStats}>
                    <div className={styles.dcStat}>
                      <span className={styles.dcNum}>{myCases.length}</span>
                      <span>תיקים</span>
                    </div>
                    <div className={styles.dcStat}>
                      <span className={styles.dcNum}>{mySessions.length}</span>
                      <span>ישיבות</span>
                    </div>
                    <div className={styles.dcStat}>
                      <span className={styles.dcNum}>{avail?.days.length ?? 0}</span>
                      <span>ימי זמינות</span>
                    </div>
                  </div>
                  <div className={styles.dcAvailRow}>
                    <Calendar size={12} />
                    <span>{dayanAvailDays(d.id)}</span>
                  </div>
                  {myCases.length > 0 && (
                    <div className={styles.dcCases}>
                      {myCases.map(c => (
                        <div key={c.id} className={styles.dcCaseChip}>
                          {c.id}
                        </div>
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