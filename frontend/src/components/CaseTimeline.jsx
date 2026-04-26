import { useState, useEffect } from 'react';
import {
  FolderOpen, FileText, Gavel, Briefcase, Calendar, CreditCard,
  RefreshCw, MessageSquare, Clock,
} from 'lucide-react';
import { api } from '../api/client';
import styles from './CaseTimeline.module.css';

const ICONS = {
  case_opened: FolderOpen,
  document_uploaded: FileText,
  dayan_assigned: Gavel,
  lawyer_assigned: Briefcase,
  hearing_scheduled: Calendar,
  payment_received: CreditCard,
  status_changed: RefreshCw,
  note_added: MessageSquare,
};

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('he-IL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CaseTimeline({ caseId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    api.get(`/cases/${caseId}/events`)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) return <div className={styles.empty}>טוען...</div>;
  if (events.length === 0) return <div className={styles.empty}><Clock size={24} /><p>אין אירועים בתיק</p></div>;

  return (
    <ol className={styles.timeline}>
      {events.map((e) => {
        const Icon = ICONS[e.event_type] || Clock;
        return (
          <li key={e.id} className={styles.item}>
            <div className={styles.dot}>
              <Icon size={14} />
            </div>
            <div className={styles.body}>
              <div className={styles.title}>{e.title}</div>
              {e.description && <div className={styles.desc}>{e.description}</div>}
              <div className={styles.time}>{formatDateTime(e.created_at)}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
