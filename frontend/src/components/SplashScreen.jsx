import { useEffect, useState } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen({ onDone, duration = 4000 }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), duration - 700);
    const doneTimer = setTimeout(() => onDone?.(), duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  return (
    <div className={`${styles.splash} ${fadingOut ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        <img src="/logo.png" alt="DinLink" className={styles.logo} />
        <div className={styles.brand}>
          <span className={styles.brandDin}>Din</span>
          <span className={styles.brandLink}>Link</span>
        </div>
        <div className={styles.tagline}>
          <span className={styles.line} />
          הפלטפורמה הדיגיטלית לבתי הדין
          <span className={styles.line} />
        </div>
        <div className={styles.loader}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
