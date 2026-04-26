import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Inbox } from 'lucide-react';
import { api } from '../api/client';
import styles from './Notifications.module.css';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'עכשיו';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  return new Date(iso).toLocaleDateString('he-IL');
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/notifications/?limit=100${filter === 'unread' ? '&unread_only=true' : ''}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleClick = async (n) => {
    if (!n.is_read) {
      try { await api.post(`/notifications/${n.id}/read`); } catch {}
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try { await api.post('/notifications/read-all'); } catch {}
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
  };

  return (
    <div className="page-content">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bell size={22} />
          <h2>התראות</h2>
        </div>
        <button className={styles.markAllBtn} onClick={markAllRead}>
          <CheckCheck size={14} /> סמן הכל כנקרא
        </button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`}
          onClick={() => setFilter('all')}>הכל</button>
        <button className={`${styles.tab} ${filter === 'unread' ? styles.tabActive : ''}`}
          onClick={() => setFilter('unread')}>לא נקראו</button>
      </div>

      <div className={`card ${styles.card}`}>
        {loading ? (
          <div className={styles.empty}>טוען...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={32} />
            <p>{filter === 'unread' ? 'אין התראות שלא נקראו' : 'אין התראות'}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map(n => (
              <button key={n.id}
                className={`${styles.item} ${!n.is_read ? styles.itemUnread : ''}`}
                onClick={() => handleClick(n)}>
                {!n.is_read && <span className={styles.dot} />}
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{n.title}</div>
                  {n.body && <div className={styles.itemBody}>{n.body}</div>}
                </div>
                <div className={styles.itemMeta}>
                  <span>{timeAgo(n.created_at)}</span>
                  {n.is_read && <Check size={12} />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
