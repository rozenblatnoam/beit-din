import { NavLink, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Gavel, ShieldCheck, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isLoggedIn, user, loggedDayan, loggedLawyer, isAdmin, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'דף הבית', exact: true },
    { to: '/dashboard', label: 'אזור אישי' },
    { to: '/new-case', label: 'פתיחת תיק' },
    { to: '/documents', label: 'מסמכים' },
    { to: '/payment', label: 'סליקה' },
    { to: '/dayan', label: 'פורטל דיינים', icon: <Gavel size={13} /> },
    { to: '/lawyer', label: 'פורטל עו"ד/טו"ר', icon: <Briefcase size={13} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo}>
          <img src="/logo.png" alt="DinLink" className={styles.logoImg} />
          <div className={styles.logoBrand}>
            <span className={styles.logoBrandDin}>Din</span>
            <span className={styles.logoBrandLink}>Link</span>
          </div>
        </NavLink>

        <div className={`${styles.navLinks} ${mobileOpen ? styles.mobileOpen : ''}`}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon && <span style={{ marginLeft: '4px', display: 'inline-flex', verticalAlign: 'middle' }}>{item.icon}</span>}
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin/scheduler"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
              style={{ color: 'var(--gold)' }}
            >
              <ShieldCheck size={13} style={{ marginLeft: '4px', display: 'inline', verticalAlign: 'middle' }} />
              שיבוץ מנהל
            </NavLink>
          )}
        </div>

        <div className={styles.navActions}>
          {loggedDayan ? (
            <div className={styles.userMenu}>
              <div className={styles.userBadge}>
                <Gavel size={14} />
                <span>{loggedDayan.short_name || loggedDayan.name}</span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout} title="יציאה">
                <LogOut size={14} />
              </button>
            </div>
          ) : loggedLawyer ? (
            <div className={styles.userMenu}>
              <div className={styles.userBadge}>
                <Briefcase size={14} />
                <span>{loggedLawyer.short_name || loggedLawyer.name}</span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout} title="יציאה">
                <LogOut size={14} />
              </button>
            </div>
          ) : isAdmin ? (
            <div className={styles.userMenu}>
              <div className={styles.userBadge}>
                <ShieldCheck size={14} />
                <span>מנהל</span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout} title="יציאה">
                <LogOut size={14} />
              </button>
            </div>
          ) : isLoggedIn ? (
            <div className={styles.userMenu}>
              <div className={styles.userBadge}>
                <User size={14} />
                <span>{user?.name}</span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout} title="יציאה">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className={styles.loginBtn} onClick={() => navigate('/login')}>
              התחברות / הרשמה
            </button>
          )}

          <button className={styles.mobileToggle} onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
