import { useNavigate } from 'react-router-dom';
import { FolderOpen, User, FileText, CreditCard, Calendar, Mail, Lock, Scroll, ArrowLeft } from 'lucide-react';
import styles from './Home.module.css';

const services = [
  { icon: <FolderOpen size={28} />, title: 'פתיחת תיק דיגיטלי', desc: 'הגישו תביעה ופתחו תיק מקוון בצורה מאובטחת ומהירה', route: '/new-case', badge: 'ממשק חדש' },
  { icon: <User size={28} />, title: 'אזור אישי', desc: 'נהלו את התיקים, המסמכים, הפגישות ועדכוני ההליך שלכם', route: '/dashboard' },
  { icon: <FileText size={28} />, title: 'מסמכים ואסמכתאות', desc: 'העלאה, הורדה וניהול מסמכי התיק בצורה מסודרת ומאובטחת', route: '/documents' },
  { icon: <CreditCard size={28} />, title: 'סליקה ותשלומים', desc: 'תשלום אגרות בית הדין, שכר דיינים ועלויות נוספות', route: '/payment', badge: 'מאובטח SSL' },
  { icon: <Calendar size={28} />, title: 'קביעת מועד דיון', desc: 'תיאום מועד הדיון בהתאם ללוח הזמנים של בית הדין', route: '/dashboard' },
  { icon: <Mail size={28} />, title: 'הזמנות ומכתבים', desc: 'קבלה ואישור הזמנות רשמיות לדיון ממשרד בית הדין', route: '/dashboard' },
  { icon: <Lock size={28} />, title: 'הסכם בוררות', desc: 'חתימה דיגיטלית על שטר בוררות בהתאם לדרישות החוק', route: '/new-case' },
  { icon: <Scroll size={28} />, title: 'פסקי דין', desc: 'צפייה בפסק הדין ואישורים רשמיים לאחר תום ההליך', route: '/documents' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.homePage}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            ברוכים הבאים למערכת <span className={styles.heroBrand}><span className={styles.heroDin}>Din</span><span className={styles.heroLink}>Link</span></span>
          </h1>
          <p className={styles.heroDesc}>
            פלטפורמה דיגיטלית מתקדמת לניהול הליכי בוררות ודיני ממונות בהתאם לדין תורה.
            פתחו תיק, הגישו מסמכים ועקבו אחר ההליך — הכל במקום אחד, מאובטח ונגיש.
          </p>
          <div className={styles.heroActions}>
            <button className="btn-primary" onClick={() => navigate('/new-case')}>
              פתיחת תיק דיגיטלי
              <ArrowLeft size={16} />
            </button>
            <button className="btn-outline" onClick={() => navigate('/dashboard')}
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}
            >
              כניסה לאזור אישי
            </button>
          </div>
        </div>
        <div className={styles.heroDecor}>⚖</div>
      </section>

      {/* LOGO BANNER */}
      <section className={styles.logoBanner}>
        <img src="/logo.png" alt="DinLink" className={styles.logoBannerImg} />
        <div className={styles.logoBannerText}>
          <div className={styles.logoBannerBrand}>
            <span className={styles.logoBannerDin}>Din</span>
            <span className={styles.logoBannerLink}>Link</span>
          </div>
          <div className={styles.logoBannerTagline}>הפלטפורמה הדיגיטלית לבתי הדין</div>
        </div>
      </section>

      <div className="page-content" style={{ paddingTop: '2rem' }}>
        {/* SERVICES */}
        <div className="section-title">שירותי בית הדין</div>
        <div className={styles.servicesGrid}>
          {services.map((svc, i) => (
            <div
              key={i}
              className={styles.serviceCard}
              onClick={() => navigate(svc.route)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={styles.svcIconWrap}>{svc.icon}</div>
              <div className={styles.svcTitle}>{svc.title}</div>
              <div className={styles.svcDesc}>{svc.desc}</div>
              {svc.badge && <span className="badge badge-gold">{svc.badge}</span>}
            </div>
          ))}
        </div>

        {/* INFO ROW */}
        <div className={styles.infoRow}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📞</div>
            <div><strong>טלפון</strong><br />052-946-70-71</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📧</div>
            <div><strong>דוא"ל</strong><br />karmeimishpat@gmail.com</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🕘</div>
            <div><strong>שעות פעילות</strong><br />א׳-ה׳ 09:00–18:00</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📍</div>
            <div><strong>כתובת</strong><br />רחוב המכבים 5, ענב</div>
          </div>
        </div>
      </div>
    </div>
  );
}
