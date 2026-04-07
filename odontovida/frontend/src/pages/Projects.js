import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', member_ids: [] });
  const { user } = useAuth();

  const load = () => {
    api.get('/projects').then(r => setProjects(r.data));
    api.get('/users').then(r => setUsers(r.data));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ title: '', description: '', start_date: '', end_date: '', member_ids: [] }); setShowModal(true); };
  const openEdit = p => { setEditing(p); setForm({ title: p.title, description: p.description || '', start_date: p.start_date || '', end_date: p.end_date || '', member_ids: p.members?.map(m => m.id) || [] }); setShowModal(true); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editing) await api.put(`/projects/${editing.id}`, form);
    else await api.post('/projects', form);
    setShowModal(false);
    load();
  };

  const handleDelete = async id => {
    if (window.confirm('Excluir este projeto e todas suas tarefas?')) {
      await api.delete(`/projects/${id}`);
      load();
    }
  };

  const toggleMember = id => setForm(f => ({ ...f, member_ids: f.member_ids.includes(id) ? f.member_ids.filter(x => x !== id) : [...f.member_ids, id] }));

  const progress = p => p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Projetos</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 2 }}>{projects.length} projeto(s) encontrado(s)</p>
        </div>
        <button onClick={openNew} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>+ Novo projeto</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)', flex: 1 }}>{p.title}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(p)} style={{ background: 'var(--gray-100)', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}>✏️</button>
                {user?.role === 'admin' && <button onClick={() => handleDelete(p.id)} style={{ background: '#fef2f2', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}>🗑️</button>}
              </div>
            </div>
            {p.description && <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>}
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
              {p.start_date && <span>📅 {new Date(p.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
              {p.end_date && <span style={{ marginLeft: 8 }}>→ {new Date(p.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--gray-400)' }}>Progresso</span>
                <span style={{ fontWeight: 600 }}>{progress(p)}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${progress(p)}%`, background: progress(p) === 100 ? '#22c55e' : 'var(--primary)', borderRadius: 99 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.done_count}/{p.task_count} tarefas</div>
              <div style={{ display: 'flex', gap: -4 }}>
                {p.members?.slice(0, 4).map(m => (
                  <div key={m.id} title={m.name} style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', marginLeft: -4 }}>
                    {m.name[0]}
                  </div>
                ))}
                {p.members?.length > 4 && <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gray-200)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: -4 }}>+{p.members.length - 4}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? 'Editar projeto' : 'Novo projeto'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Título *<input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
            <label style={labelStyle}>Descrição<textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>Data de início<input type="date" style={inputStyle} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></label>
              <label style={labelStyle}>Prazo final<input type="date" style={inputStyle} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>Membros</span>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {users.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: `1.5px solid ${form.member_ids.includes(u.id) ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, background: form.member_ids.includes(u.id) ? 'var(--primary-light)' : '#fff' }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={form.member_ids.includes(u.id)} onChange={() => toggleMember(u.id)} />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'var(--gray-100)', borderRadius: 8, fontWeight: 600 }}>Cancelar</button>
              <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 600 }}>Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
