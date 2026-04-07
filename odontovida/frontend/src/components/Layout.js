import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/projects', icon: '📁', label: 'Projetos' },
  { to: '/kanban', icon: '📋', label: 'Kanban' },
  { to: '/calendar', icon: '📅', label: 'Calendário' },
  { to: '/users', icon: '👥', label: 'Usuários', adminOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🦷</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>OdontoVida</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Gestão de Tarefas</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.filter(i => !i.adminOnly || user?.role === 'admin').map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 4,
                background: isActive ? 'rgba(37,99,235,.3)' : 'transparent',
                color: isActive ? '#93c5fd' : '#cbd5e1',
                transition: 'all .15s'
              })}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '9px 12px', background: 'rgba(239,68,68,.15)', color: '#fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            🚪 Sair
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: 28, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
