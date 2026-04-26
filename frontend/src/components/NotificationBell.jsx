import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { api } from '../api/client';
import styles from './NotificationBell.module.css';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'עכשיו';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק׳`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const ref = useRef(null);

  const refresh = async () => {
    try {
      const [list, count] = await Promise.all([
        api.get('/notifications/?limit=10'),
        api.get('/notifications/unread-count'),
      ]);
      setItems(list);
      setUnread(count.count);
    } catch {
      // not authenticated yet — ignore
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000); // poll every minute
    return () => clearInterval(id);
  }, []);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = async (n) => {
    try { await api.post(`/notifications/${n.id}/read`); } catch {}
    setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    setUnread((c) => Math.max(0, c - (n.is_read ? 0 : 1)));
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try { await api.post('/notifications/read-all'); } catch {}
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.btn} onClick={() => { setOpen(o => !o); if (!open) refresh(); }} title="התראות">
        <Bell size={16} />
        {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.head}>
            <span>התראות</span>
            {items.some(i => !i.is_read) && (
              <button className={styles.allReadBtn} onClick={markAllRead}>
                <Check size={12} /> סמן הכל כנקרא
              </button>
            )}
          </div>
          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.empty}>אין התראות חדשות</div>
            ) : items.map(n => (
              <button key={n.id}
                className={`${styles.item} ${!n.is_read ? styles.itemUnread : ''}`}
                onClick={() => handleClick(n)}>
                <div className={styles.itemTitle}>{n.title}</div>
                {n.body && <div className={styles.itemBody}>{n.body}</div>}
                <div className={styles.itemTime}>{timeAgo(n.created_at)}</div>
              </button>
            ))}
          </div>
          <button className={styles.seeAll} onClick={() => { setOpen(false); navigate('/notifications'); }}>
            ראה את כל ההתראות
          </button>
        </div>
      )}
    </div>
  );
}
