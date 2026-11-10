# AI-Based IT Training System

A modern, production-ready full-stack platform designed for AI-driven IT training, personalized curriculum generation, adaptive skill assessments, and learner analytics.

---

## Project Structure

```
IT-TrainingProject/
│
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Assessment.jsx
│   │   │   ├── Courses.jsx
│   │   │   └── Progress.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── server/                     # Backend Application (Node.js + Express + Prisma 7)
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── assessment.routes.js
│   │   │   ├── course.routes.js
│   │   │   └── progress.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── assessment.controller.js
│   │   │   └── course.controller.js
│   │   ├── services/
│   │   │   ├── assessment.service.js
│   │   │   ├── skill.service.js
│   │   │   ├── course.service.js
│   │   │   └── progress.service.js
│   │   ├── ai/
│   │   │   ├── ai.service.js
│   │   │   ├── course.generator.js
│   │   │   ├── quiz.generator.js
│   │   │   └── recommendation.engine.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── utils/
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── prisma.config.js
│   ├── package.json
│   └── .env.example
│
├── README.md
├── .gitignore
└── package.json
```

---

## Technology Stack

### Frontend
- **Framework:** React.js 19
- **Build Tool:** Vite 6
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (CommonJS)
- **Database & ORM:** PostgreSQL, Prisma ORM v7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Validation:** Zod
- **Authentication:** JSON Web Tokens (JWT) & bcrypt
- **Utilities:** Cookie Parser, CORS, Dotenv

### AI Architecture (Phase 1 Scaffolding)
- Modular isolation under `server/src/ai/` for:
  - Skill assessment
  - Course generation
  - Adaptive quiz generation
  - Recommendation engine & performance analysis

---

## Environment Setup

### 1. Backend Environment (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Fill in the variables:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5001
CLIENT_URL=http://localhost:5173
```

### 2. Frontend Environment (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
Default value:
```env
VITE_API_URL=http://localhost:5001/api
```

---

## Installation & Running

### Install Dependencies

From root (`IT-TrainingProject/`):
```bash
npm run install:all
```
Or individually:
```bash
# Client
cd client && npm install

# Server
cd ../server && npm install
```

### Start Development Servers

Run both concurrently from root:
```bash
npm run dev
```

Or run separately:
```bash
# Start Client (Vite Dev Server)
npm run dev:client
# (Runs on http://localhost:5173)

# Start Server (Nodemon Dev Server)
npm run dev:server
# (Runs on http://localhost:5001)
```

### Prisma Commands (Server)
```bash
# Generate Prisma Client
npm run prisma:generate --prefix server

# Run Database Migrations (Phase 2, after defining models)
npm run prisma:migrate --prefix server
```

