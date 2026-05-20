# OpportunityOS — Full Stack MEAN Application

**Tech Jobs · Govt Jobs (AI PDF Scanner) · DSA Teaching · Freelance**  
Built for Jaswanth Chelemilla · SDE-2 · Node.js/TypeScript/Redis/MEAN · Hyderabad

---

## Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Frontend   | Angular 17+ (standalone, signals)       |
| Backend    | Node.js 20 + Express.js + TypeScript    |
| Database   | MongoDB Atlas (free 512MB)              |
| Cache      | Redis / Upstash (free tier)             |
| AI         | Anthropic Claude Sonnet + web_search    |
| Deployment | Frontend → Vercel · Backend → Railway   |

---

## Project Structure

```
opportunityos/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, Redis, app config, govt orgs list
│   │   ├── controllers/   # All module controllers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # Express routes
│   │   ├── services/      # AI service (Anthropic), data service
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Helpers, URL builder
│   │   └── server.ts      # Entry point
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── models/       # All TypeScript interfaces
│   │   │   ├── services/     # ApiService, AppStateService
│   │   │   └── interceptors/ # HTTP interceptor
│   │   ├── modules/          # sde, resume, govt, teach, freelance
│   │   └── shared/           # navbar, sidebar components
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free)
- Upstash Redis account (free)
- Anthropic API key

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Fill in your .env values

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
ANTHROPIC_API_KEY=sk-ant-...
CLIENT_ORIGIN=http://localhost:4200
```

### 3. Run locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npx @angular/cli serve
```

Open: http://localhost:4200

---

## Docker (Full Stack)

```bash
# Copy .env.example to .env and fill in values
cp backend/.env.example backend/.env

# Build and start everything
docker-compose up --build

# Frontend: http://localhost:4200
# Backend:  http://localhost:3000/api/health
```

---

## Deployment

### Backend → Railway

1. Go to railway.app → New Project → Deploy from GitHub
2. Select the `backend/` folder (or root with start command `cd backend && npm run build && npm start`)
3. Add environment variables from `.env.example`
4. Deploy — Railway gives you a URL like `https://opportunityos-api.railway.app`

### Frontend → Vercel

1. Go to vercel.com → New Project → Import GitHub repo
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist/opportunityos-frontend/browser`
5. Add env: `API_URL=https://opportunityos-api.railway.app/api`
6. Update `environment.prod.ts` with your Railway URL
7. Deploy — Vercel gives you a URL like `https://opportunityos.vercel.app`

---

## API Endpoints

| Method | Endpoint                               | Description                        |
|--------|----------------------------------------|------------------------------------|
| GET    | /api/health                            | Health check                       |
| GET    | /api/modules/sde?location=hyderabad    | SDE/SWE/SE jobs with search URLs   |
| GET    | /api/modules/resume?location=hyderabad | Resume-matched jobs                |
| GET    | /api/modules/govt?refresh=true         | Govt jobs (AI fetches live PDFs)   |
| POST   | /api/modules/govt/:orgId/refresh       | Re-scan a single govt organisation |
| GET    | /api/modules/teach                     | Teaching opportunities             |
| GET    | /api/modules/freelance                 | Freelance opportunities            |
| GET    | /api/stats                             | Search analytics                   |

---

## Adding a New Module (Scalable Design)

1. **Backend** — Add controller in `src/controllers/`, register route in `src/routes/index.ts`
2. **Frontend** — Add component in `src/app/modules/`, add route in `app.routes.ts`, add config to `MODULE_CONFIGS` in `core/models/index.ts`
3. **Sidebar** auto-updates — it reads from `MODULE_CONFIGS`

That's it. The system auto-scales.

---

## Caching Strategy

| Module    | Redis TTL  | MongoDB TTL | Reason                         |
|-----------|-----------|-------------|-------------------------------|
| SDE/Resume| 1 hour    | N/A         | Static data, short cache       |
| Govt      | 12 hours  | 12 hours    | AI fetch is expensive, cache both |
| Teaching  | 24 hours  | N/A         | Rarely changes                 |
| Freelance | 24 hours  | N/A         | Rarely changes                 |
