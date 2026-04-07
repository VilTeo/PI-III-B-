import { useEffect, useState } from 'react';
import api from '../api';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const priorityColors = { alta: '#dc2626', media: '#d97706', baixa: '#16a34a' };

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [today] = useState(new Date());
  const [current, setCurrent] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.get('/tasks').then(r => setTasks(r.data)); }, []);

  const getTasksForDay = (year, month, day) => {
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const isToday = d => d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();
  const selectedTasks = selected ? getTasksForDay(current.year, current.month, selected) : [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Calendário</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 2 }}>Visualize os prazos das tarefas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: 'var(--gray-100)', borderRadius: 8, padding: '8px 14px', fontSize: 16 }}>‹</button>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{MONTHS[current.month]} {current.year}</h2>
            <button onClick={nextMonth} style={{ background: 'var(--gray-100)', borderRadius: 8, padding: '8px 14px', fontSize: 16 }}>›</button>
          </div>

          {/* Day names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', padding: '4px 0' }}>{d}</div>)}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dayTasks = getTasksForDay(current.year, current.month, day);
              const isSelected = selected === day;
              return (
                <div key={idx} onClick={() => setSelected(isSelected ? null : day)}
                  style={{ minHeight: 72, padding: 6, borderRadius: 8, border: `1.5px solid ${isSelected ? 'var(--primary)' : isToday(day) ? 'var(--primary)' : 'transparent'}`, background: isSelected ? 'var(--primary-light)' : isToday(day) ? '#eff6ff' : 'var(--gray-50)', cursor: 'pointer', transition: 'all .15s' }}>
                  <div style={{ fontSize: 13, fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? 'var(--primary)' : 'var(--gray-800)', marginBottom: 4 }}>{day}</div>
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} style={{ fontSize: 10, background: priorityColors[t.priority] + '22', color: priorityColors[t.priority], borderRadius: 4, padding: '1px 5px', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 600 }}>{t.title}</div>
                  ))}
                  {dayTasks.length > 2 && <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>+{dayTasks.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', height: 'fit-content' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--gray-800)' }}>
            {selected ? `${selected} de ${MONTHS[current.month]}` : 'Selecione um dia'}
          </h3>
          {!selected && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Clique em um dia para ver as tarefas com prazo nessa data.</p>}
          {selected && selectedTasks.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhuma tarefa com prazo neste dia.</p>}
          {selectedTasks.map(t => (
            <div key={t.id} style={{ padding: '10px 12px', border: '1px solid var(--gray-100)', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[t.priority], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{t.title}</span>
              </div>
              {t.project_title && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>📁 {t.project_title}</div>}
              {t.assignee_name && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>👤 {t.assignee_name}</div>}
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: { todo: '#fef9c3', doing: '#dbeafe', done: '#dcfce7' }[t.status], color: { todo: '#a16207', doing: '#1d4ed8', done: '#15803d' }[t.status], fontWeight: 600 }}>
                  {{ todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' }[t.status]}
                </span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 10 }}>Legenda</h4>
            {[['alta', 'Prioridade alta'], ['media', 'Prioridade média'], ['baixa', 'Prioridade baixa']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: priorityColors[key] }} />
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
