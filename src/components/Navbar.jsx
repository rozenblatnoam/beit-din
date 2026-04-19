import { NavLink, useNavigate } from 'react-router-dom';
import { Scale, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'דף הבית', exact: true },
    { to: '/dashboard', label: 'אזור אישי' },
    { to: '/new-case', label: 'פתיחת תיק' },
    { to: '/documents', label: 'מסמכים' },
    { to: '/payment', label: 'סליקה' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Scale size={22} strokeWidth={1.5} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>כרמי המשפט</span>
            <span className={styles.logoSub}>בית דין לממונות</span>
          </div>
        </NavLink>

        <div className={`${styles.navLinks} ${mobileOpen ? styles.mobileOpen : ''}`}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.navActions}>
          {isLoggedIn ? (
            <div className={styles.userMenu}>
              <div className={styles.userBadge}>
                <User size={14} />
                <span>{user.name}</span>
              </div>
              <button
                className={styles.logoutBtn}
                onClick={() => { setIsLoggedIn(false); navigate('/'); }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              className={styles.loginBtn}
              onClick={() => { setIsLoggedIn(true); navigate('/dashboard'); }}
            >
              התחברות / הרשמה
            </button>
          )}

          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
