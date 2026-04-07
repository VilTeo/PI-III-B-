import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'odontovida_secret_pi3b_2026';

app.use(cors());
app.use(express.json());

// ── Middlewares ───────────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores' });
  next();
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: payload });
});

app.post('/api/auth/register', auth, adminOnly, (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hash, role || 'colaborador');
    res.json({ id: result.lastInsertRowid, name, email, role: role || 'colaborador' });
  } catch {
    res.status(400).json({ error: 'E-mail já cadastrado' });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// ── USERS ─────────────────────────────────────────────────────────────────────
app.get('/api/users', auth, (req, res) => {
  res.json(db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all());
});

app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── PROJECTS ──────────────────────────────────────────────────────────────────
app.get('/api/projects', auth, (req, res) => {
  const uid = req.user.id;
  const projects = db.prepare(`
    SELECT p.*, u.name AS owner_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') AS done_count
    FROM projects p
    JOIN users u ON u.id = p.owner_id
    WHERE p.owner_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
    ORDER BY p.created_at DESC
  `).all(uid, uid);

  const memberStmt = db.prepare(`
    SELECT u.id, u.name, u.email, u.role
    FROM users u JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `);
  for (const p of projects) p.members = memberStmt.all(p.id);

  res.json(projects);
});

app.post('/api/projects', auth, (req, res) => {
  const { title, description, start_date, end_date, member_ids = [] } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  const result = db.prepare('INSERT INTO projects (title, description, start_date, end_date, owner_id) VALUES (?, ?, ?, ?, ?)').run(title, description ?? null, start_date ?? null, end_date ?? null, req.user.id);
  const pid = result.lastInsertRowid;

  const addMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)');
  addMember.run(pid, req.user.id);
  for (const uid of member_ids) addMember.run(pid, uid);

  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(pid));
});

app.put('/api/projects/:id', auth, (req, res) => {
  const pid = Number(req.params.id);
  const { title, description, start_date, end_date, member_ids } = req.body ?? {};

  db.prepare('UPDATE projects SET title=?, description=?, start_date=?, end_date=? WHERE id=?').run(title, description ?? null, start_date ?? null, end_date ?? null, pid);

  if (Array.isArray(member_ids)) {
    db.prepare('DELETE FROM project_members WHERE project_id = ?').run(pid);
    const addMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)');
    addMember.run(pid, req.user.id);
    for (const uid of member_ids) addMember.run(pid, uid);
  }
  res.json({ ok: true });
});

app.delete('/api/projects/:id', auth, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── TASKS ─────────────────────────────────────────────────────────────────────
const TASK_SELECT = `
  SELECT t.*, u.name AS assignee_name, ub.name AS created_by_name, p.title AS project_title
  FROM tasks t
  LEFT JOIN users u  ON u.id  = t.assignee_id
  LEFT JOIN users ub ON ub.id = t.created_by
  LEFT JOIN projects p ON p.id = t.project_id
`;

app.get('/api/tasks', auth, (req, res) => {
  const { project_id } = req.query;
  if (project_id) {
    res.json(db.prepare(TASK_SELECT + ' WHERE t.project_id = ? ORDER BY t.created_at DESC').all(Number(project_id)));
  } else {
    res.json(db.prepare(TASK_SELECT + ' ORDER BY t.due_date ASC NULLS LAST').all());
  }
});

app.post('/api/tasks', auth, (req, res) => {
  const { title, description, status = 'todo', priority = 'media', due_date, project_id, assignee_id } = req.body ?? {};
  if (!title || !project_id) return res.status(400).json({ error: 'Título e projeto são obrigatórios' });

  const result = db.prepare('INSERT INTO tasks (title,description,status,priority,due_date,project_id,assignee_id,created_by) VALUES (?,?,?,?,?,?,?,?)').run(title, description ?? null, status, priority, due_date ?? null, project_id, assignee_id ?? null, req.user.id);

  const task = db.prepare(TASK_SELECT + ' WHERE t.id = ?').get(result.lastInsertRowid);
  res.json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const { title, description, status, priority, due_date, assignee_id } = req.body ?? {};
  db.prepare('UPDATE tasks SET title=?,description=?,status=?,priority=?,due_date=?,assignee_id=? WHERE id=?').run(title, description ?? null, status, priority, due_date ?? null, assignee_id ?? null, Number(req.params.id));
  res.json({ ok: true });
});

app.patch('/api/tasks/:id/status', auth, (req, res) => {
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(req.body.status, Number(req.params.id));
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, (req, res) => {
  const uid = req.user.id;
  const totalProjects = db.prepare('SELECT COUNT(*) AS c FROM projects WHERE owner_id=? OR id IN (SELECT project_id FROM project_members WHERE user_id=?)').get(uid, uid).c;
  const totalTasks    = db.prepare("SELECT COUNT(*) AS c FROM tasks").get().c;
  const doneTasks     = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status='done'").get().c;
  const pendingTasks  = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status='todo'").get().c;
  const doingTasks    = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status='doing'").get().c;
  const upcoming      = db.prepare(`
    SELECT t.*, p.title AS project_title, u.name AS assignee_name
    FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN users u ON u.id=t.assignee_id
    WHERE t.status != 'done' AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC LIMIT 5
  `).all();

  res.json({ totalProjects, totalTasks, doneTasks, pendingTasks, doingTasks, upcoming });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🦷 OdontoVida API rodando em http://localhost:${PORT}`);
  console.log(`   Banco: node:sqlite (nativo Node.js ${process.version})`);
});
