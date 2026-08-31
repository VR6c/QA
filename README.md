# QA & Product Engineering Control Center (v2.0)

An enterprise-grade SaaS web application for managing QA and product-engineering tasks with a 6-swimlane drag-and-drop board, sortable data table, and executive KPI dashboard.
 
 ## Technology Stack
 
 - **Frontend**: React 19 SPA, TypeScript, Vite, Tailwind CSS 4, Zustand, TanStack Query v5, `@dnd-kit`, Recharts, Sonner, Lucide Icons.
 - **Backend**: Node.js, Express.js REST API, Mongoose ODM.
 - **Database**: MongoDB v7+ (`mongodb://localhost:27017/qa_control_center`).
 
 ## Features
 
 - **Header & Navigation**: Branding, live sync pulse badge, 12 month tabs for 2026, 3-way view switcher, and CSV data exporter.
 - **Top Metric Cards**: Real-time calculated total tasks, done rate %, in progress, blockers/issues, and QA pipeline count.
 - **Advanced Filters**: Full text search across title/reason/remark, status filter, push-to environment filter, date range pickers, and quick date pills with badges.
 - **Drag-and-Drop Board**: 6 swimlanes (`Feedback & Issue`, `In Progress`, `Testing / QA`, `QA Success`, `Done / Deployed`, `Backlog / Pending`) with optimistic status updates and toasts.
- **Sortable Data Table**: Interactive table view with asc/desc header sorting and status badges.
- **Executive KPIs**: Visual dashboard with status distribution donut chart, environment breakdown bar chart, daily task volume activity area chart, and column capacity load chart.
- **Task CRUD Modal**: Create, edit, and delete tasks persisted to MongoDB via Express API.
- **Idempotent Auto-Seed**: Automatically seeds sample August 2026 tasks if database is empty on first boot.

## Getting Started

### 1. Prerequisites
- Node.js (v20+)
- MongoDB running locally on port 27017 (`mongodb://localhost:27017`)

### 2. Install & Run

```bash
# Install dependencies for both backend and frontend
npm run install:all

# Start backend Express server (http://localhost:5000)
npm run dev:backend

# In a separate terminal, start frontend Vite server (http://localhost:3000)
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoint Summary

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id` | Update task by ID |
| `DELETE` | `/api/tasks/:id` | Delete task by ID |
| `POST` | `/api/tasks/seed` | Idempotent initial seed |
