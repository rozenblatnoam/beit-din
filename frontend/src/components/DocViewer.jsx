import { useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import styles from './DocViewer.module.css';

/**
 * Convert a Google Drive view URL to an embeddable preview URL.
 * Drive's normal share URL: https://drive.google.com/file/d/FILE_ID/view?...
 * Embed-friendly URL:       https://drive.google.com/file/d/FILE_ID/preview
 */
function toEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
}

export default function DocViewer({ doc, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!doc) return null;

  const embed = toEmbedUrl(doc.drive_view_url);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <div className={styles.title}>{doc.name}</div>
          <div className={styles.actions}>
            {doc.drive_view_url && (
              <a href={doc.drive_view_url} target="_blank" rel="noreferrer" className={styles.action} title="פתח בכרטיסייה חדשה">
                <ExternalLink size={16} />
              </a>
            )}
            <button className={styles.action} onClick={onClose} title="סגור">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className={styles.body}>
          {embed ? (
            <iframe src={embed} title={doc.name} className={styles.frame} allow="autoplay" />
          ) : (
            <div className={styles.empty}>אין תצוגה מקדימה זמינה למסמך זה</div>
          )}
        </div>
      </div>
    </div>
  );
}
