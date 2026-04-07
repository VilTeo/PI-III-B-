import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const cols = [
  { id: 'todo', label: 'A fazer', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'doing', label: 'Em andamento', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'done', label: 'Concluído', color: '#22c55e', bg: '#f0fdf4' },
];

const priorityColors = { alta: '#dc2626', media: '#d97706', baixa: '#16a34a' };
const priorityLabels = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
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

export default function Kanban() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dragTask, setDragTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'media', due_date: '', project_id: '', assignee_id: '' });
  const { user } = useAuth();

  const load = () => {
    const params = selectedProject ? `?project_id=${selectedProject}` : '';
    api.get(`/tasks${params}`).then(r => setTasks(r.data));
  };

  useEffect(() => {
    api.get('/projects').then(r => { setProjects(r.data); if (r.data.length) setSelectedProject(r.data[0].id); });
    api.get('/users').then(r => setUsers(r.data));
  }, []);

  useEffect(() => { load(); }, [selectedProject]);

  const openNew = (status = 'todo') => {
    setEditing(null);
    setForm({ title: '', description: '', priority: 'media', due_date: '', project_id: selectedProject || '', assignee_id: '', status });
    setShowModal(true);
  };

  const openEdit = task => {
    setEditing(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date || '', project_id: task.project_id, assignee_id: task.assignee_id || '', status: task.status });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editing) await api.put(`/tasks/${editing.id}`, form);
    else await api.post('/tasks', form);
    setShowModal(false);
    load();
  };

  const handleDelete = async id => {
    if (window.confirm('Excluir esta tarefa?')) { await api.delete(`/tasks/${id}`); load(); }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!dragTask || dragTask.status === newStatus) return;
    await api.patch(`/tasks/${dragTask.id}/status`, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === dragTask.id ? { ...t, status: newStatus } : t));
    setDragTask(null);
  };

  const getColTasks = status => tasks.filter(t => t.status === status);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quadro Kanban</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 2 }}>Arraste as tarefas entre as colunas</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            <option value="">Todos os projetos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button onClick={() => openNew()} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>+ Nova tarefa</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {cols.map(col => (
          <div key={col.id}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, col.id)}
            style={{ background: col.bg, borderRadius: 12, padding: 16, minHeight: 500, border: `1.5px solid ${col.color}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{col.label}</span>
                <span style={{ background: col.color + '22', color: col.color, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{getColTasks(col.id).length}</span>
              </div>
              <button onClick={() => openNew(col.id)} style={{ background: col.color + '22', color: col.color, borderRadius: 6, padding: '4px 8px', fontSize: 16, fontWeight: 700 }}>+</button>
            </div>

            {getColTasks(col.id).map(task => (
              <div key={task.id} draggable onDragStart={() => setDragTask(task)}
                style={{ background: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, boxShadow: 'var(--shadow)', cursor: 'grab', border: '1px solid var(--gray-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)', flex: 1, lineHeight: 1.4 }}>{task.title}</p>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openEdit(task)} style={{ background: 'var(--gray-100)', borderRadius: 5, padding: '3px 6px', fontSize: 11 }}>✏️</button>
                    <button onClick={() => handleDelete(task.id)} style={{ background: '#fef2f2', borderRadius: 5, padding: '3px 6px', fontSize: 11 }}>🗑️</button>
                  </div>
                </div>
                {task.description && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6, lineHeight: 1.4 }}>{task.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: priorityColors[task.priority] + '18', color: priorityColors[task.priority], fontWeight: 600 }}>
                    {priorityLabels[task.priority]}
                  </span>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--gray-400)' }}>
                    {task.assignee_name && <span>👤 {task.assignee_name.split(' ')[0]}</span>}
                    {task.due_date && <span>📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                {task.project_title && !selectedProject && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--gray-400)', borderTop: '1px solid var(--gray-100)', paddingTop: 8 }}>📁 {task.project_title}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? 'Editar tarefa' : 'Nova tarefa'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Título *<input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
            <label style={labelStyle}>Descrição<textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>Prioridade
                <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </label>
              <label style={labelStyle}>Status
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="todo">A fazer</option>
                  <option value="doing">Em andamento</option>
                  <option value="done">Concluído</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>Projeto *
                <select style={inputStyle} value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} required>
                  <option value="">Selecione</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
              <label style={labelStyle}>Responsável
                <select style={inputStyle} value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                  <option value="">Nenhum</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
            </div>
            <label style={labelStyle}>Prazo<input type="date" style={inputStyle} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'var(--gray-100)', borderRadius: 8, fontWeight: 600 }}>Cancelar</button>
              <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 600 }}>Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
