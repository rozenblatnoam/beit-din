import { Scale } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}><Scale size={18} strokeWidth={1.5} /></div>
          <div>
            <div className={styles.name}>כרמי המשפט</div>
            <div className={styles.sub}>בית דין לממונות</div>
          </div>
        </div>
        <div className={styles.links}>
          <span>תקנון</span>
          <span>פרטיות</span>
          <span>נגישות</span>
          <span>צור קשר</span>
        </div>
        <div className={styles.copy}>
          © {new Date().getFullYear()} כרמי המשפט. כל הזכויות שמורות. מס' רישום: 58-123456
        </div>
      </div>
    </footer>
  );
}
