import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 48, height: 48, background: color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-800)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const statusColors = { todo: '#f59e0b', doing: '#3b82f6', done: '#22c55e' };
const statusLabels = { todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' };
const priorityColors = { alta: '#dc2626', media: '#d97706', baixa: '#16a34a' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return <div style={{ color: 'var(--gray-400)', padding: 40, textAlign: 'center' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-800)' }}>Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--gray-400)', marginTop: 4, fontSize: 14 }}>Veja o resumo das atividades da clínica</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon="📁" label="Projetos ativos" value={data.totalProjects} color="#2563eb" />
        <StatCard icon="📋" label="Total de tarefas" value={data.totalTasks} color="#7c3aed" />
        <StatCard icon="⏳" label="A fazer" value={data.pendingTasks} color="#d97706" />
        <StatCard icon="✅" label="Concluídas" value={data.doneTasks} color="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Progress */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--gray-800)' }}>Progresso geral</h2>
          {[
            { label: 'A fazer', count: data.pendingTasks, total: data.totalTasks, color: '#f59e0b' },
            { label: 'Em andamento', count: data.doingTasks, total: data.totalTasks, color: '#3b82f6' },
            { label: 'Concluído', count: data.doneTasks, total: data.totalTasks, color: '#22c55e' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--gray-600)' }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{item.count}</span>
              </div>
              <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${data.totalTasks ? (item.count / data.totalTasks) * 100 : 0}%`, background: item.color, borderRadius: 99, transition: 'width .5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--gray-800)' }}>Próximas entregas</h2>
          {data.upcoming.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Nenhuma tarefa pendente com prazo.</p>}
          {data.upcoming.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[task.priority] || '#999', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{task.project_title}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', flexShrink: 0 }}>
                {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: statusColors[task.status] + '22', color: statusColors[task.status], fontWeight: 600 }}>
                {statusLabels[task.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
