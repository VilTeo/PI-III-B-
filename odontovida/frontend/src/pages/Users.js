import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'var(--gray-100)', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, marginTop: 4 };
const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 12 };
const roleColors = { admin: { bg: '#eff6ff', color: '#1d4ed8' }, colaborador: { bg: '#f0fdf4', color: '#15803d' } };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'colaborador' });
  const [error, setError] = useState('');
  const { user: me } = useAuth();

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'colaborador' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar usuário');
    }
  };

  const handleDelete = async id => {
    if (id === me.id) return alert('Você não pode excluir seu próprio usuário.');
    if (window.confirm('Excluir este usuário?')) { await api.delete(`/users/${id}`); load(); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Usuários</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 2 }}>{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>+ Novo usuário</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Usuário', 'E-mail', 'Perfil', 'Cadastrado em', 'Ações'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.name[0]}</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--gray-600)' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, fontWeight: 600, background: roleColors[u.role]?.bg, color: roleColors[u.role]?.color }}>
                    {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gray-400)' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 16px' }}>
                  {u.id !== me.id && (
                    <button onClick={() => handleDelete(u.id)} style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>Excluir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Novo usuário" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Nome completo *<input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></label>
            <label style={labelStyle}>E-mail *<input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></label>
            <label style={labelStyle}>Senha *<input type="password" style={inputStyle} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></label>
            <label style={{ ...labelStyle, marginBottom: 20 }}>Perfil
              <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="colaborador">Colaborador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'var(--gray-100)', borderRadius: 8, fontWeight: 600 }}>Cancelar</button>
              <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 600 }}>Cadastrar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
