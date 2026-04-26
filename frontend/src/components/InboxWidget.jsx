import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Calendar, FileText, AlertCircle, Clock, Bell, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import styles from './InboxWidget.module.css';

const ICONS = {
  calendar: Calendar,
  doc: FileText,
  alert: AlertCircle,
  clock: Clock,
};

function formatDue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / 1000;
  if (diff < 0) return 'איחר';
  if (diff < 86400) return 'היום';
  if (diff < 86400 * 2) return 'מחר';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export default function InboxWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], unread_notifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inbox/')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const total = data.items.length + (data.unread_notifications > 0 ? 1 : 0);

  return (
    <div className={`card ${styles.widget}`}>
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <Inbox size={16} />
          <h3>פעולות הדורשות תגובה</h3>
        </div>
        {total > 0 && <span className={styles.count}>{total}</span>}
      </div>

      {data.unread_notifications > 0 && (
        <button className={styles.notifRow} onClick={() => navigate('/notifications')}>
          <div className={styles.iconWrap}><Bell size={14} /></div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>{data.unread_notifications} התראות שלא נקראו</div>
          </div>
          <ArrowLeft size={13} className={styles.rowArrow} />
        </button>
      )}

      {data.items.length === 0 && data.unread_notifications === 0 ? (
        <div className={styles.empty}>אין פעולות פתוחות 🎉</div>
      ) : (
        <div className={styles.list}>
          {data.items.map((item, i) => {
            const Icon = ICONS[item.icon] || Clock;
            return (
              <button key={i} className={styles.row} onClick={() => navigate(item.link)}>
                <div className={styles.iconWrap}><Icon size={14} /></div>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{item.title}</div>
                  <div className={styles.rowSub}>{item.subtitle}</div>
                </div>
                {item.due && <div className={styles.due}>{formatDue(item.due)}</div>}
                <ArrowLeft size={13} className={styles.rowArrow} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
