import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="DinLink" className={styles.logoImg} />
          <div>
            <div className={styles.name}>
              <span className={styles.nameDin}>Din</span><span className={styles.nameLink}>Link</span>
            </div>
            <div className={styles.sub}>הפלטפורמה הדיגיטלית לבתי הדין</div>
          </div>
        </div>
        <div className={styles.links}>
          <span>תקנון</span>
          <span>פרטיות</span>
          <span>נגישות</span>
          <span>צור קשר</span>
        </div>
        <div className={styles.copy}>
          © {new Date().getFullYear()} DinLink. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  );
}
