# 🦷 OdontoVida — Sistema Gerenciador de Tarefas

**Projeto Integrador III-B | PUC Goiás | Análise e Desenvolvimento de Sistemas**
**Autor:** Vilmar Francisco Teodoro Filho
**Parceiro:** Clínica OdontoVida – Goiânia/GO

---

## 📋 Sobre o projeto

Sistema web de gerenciamento de tarefas para a Clínica OdontoVida, com backend Node.js/Express, frontend React e banco SQLite.

**Funcionalidades:**
- Cadastro e autenticação de usuários (admin e colaborador)
- Criação e gerenciamento de projetos com membros e prazos
- Criação, atribuição, acompanhamento e conclusão de tarefas
- Quadro Kanban com drag-and-drop (A fazer / Em andamento / Concluído)
- Calendário de prazos com visualização mensal
- Dashboard com indicadores e próximas entregas

---

## 🚀 Como rodar localmente

**Pré-requisitos:** Node.js 22.5+ (usa o módulo nativo `node:sqlite`)

### Terminal 1 — Backend
```bash
cd backend
npm install
npm start
# API em http://localhost:3001
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm start
# App em http://localhost:3000
```

---

## 🔐 Credenciais

| Perfil        | E-mail                   | Senha     |
|---------------|--------------------------|-----------|
| Administrador | admin@odontovida.com     | Admin@123 |
| Colaborador   | ana@odontovida.com       | senha123  |
| Colaborador   | carlos@odontovida.com    | senha123  |
| Colaborador   | maria@odontovida.com     | senha123  |

---

## 🛠️ Tecnologias

- **Frontend:** React.js 18, React Router, Axios
- **Backend:** Node.js + Express, jsonwebtoken, bcryptjs
- **Banco:** SQLite via `node:sqlite` (gerado automaticamente na 1ª execução)
- **Auth:** JWT tokens
