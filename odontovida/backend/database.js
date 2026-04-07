import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'odontovida.db');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Pragma
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'colaborador',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT,
    owner_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'media',
    due_date TEXT,
    project_id INTEGER NOT NULL,
    assignee_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

// Seed
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@odontovida.com');
if (!existing) {
  const adminPw = bcrypt.hashSync('Admin@123', 10);
  const pw = bcrypt.hashSync('senha123', 10);

  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Administrador', 'admin@odontovida.com', adminPw, 'admin');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Dra. Ana Silva', 'ana@odontovida.com', pw, 'colaborador');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Dr. Carlos Lima', 'carlos@odontovida.com', pw, 'colaborador');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Maria Recepção', 'maria@odontovida.com', pw, 'colaborador');

  db.prepare('INSERT INTO projects (title, description, start_date, end_date, owner_id) VALUES (?, ?, ?, ?, ?)').run('Manutenção de Equipamentos', 'Controle das manutenções preventivas e corretivas', '2026-03-01', '2026-06-30', 1);
  db.prepare('INSERT INTO projects (title, description, start_date, end_date, owner_id) VALUES (?, ?, ?, ?, ?)').run('Controle de Estoque', 'Reposição de materiais e insumos odontológicos', '2026-03-01', '2026-12-31', 1);

  for (const [pid, uid] of [[1,1],[1,2],[1,3],[2,1],[2,4]]) {
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(pid, uid);
  }

  const tasks = [
    ['Revisão do compressor odontológico', 'Agendar técnico especializado', 'todo',  'alta',  '2026-04-10', 1, 2, 1],
    ['Calibração do autoclave',            'Certificado vence em abril',     'doing', 'alta',  '2026-04-05', 1, 3, 1],
    ['Troca dos filtros de água',           'Filtros do equipamento',         'done',  'media', '2026-03-20', 1, 2, 1],
    ['Repor luvas descartáveis',            'Estoque crítico',                'todo',  'alta',  '2026-04-02', 2, 4, 1],
    ['Compra de anestésicos',               'Verificar validade do estoque',  'doing', 'media', '2026-04-15', 2, 4, 1],
  ];
  const ins = db.prepare('INSERT INTO tasks (title,description,status,priority,due_date,project_id,assignee_id,created_by) VALUES (?,?,?,?,?,?,?,?)');
  for (const t of tasks) ins.run(...t);

  console.log('✅ Banco criado e seed aplicado.');
}

export default db;
