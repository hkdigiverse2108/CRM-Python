# AIO CRM Platform

A modern, multi-tenant SaaS-ready CRM platform featuring a React frontend and a FastAPI backend.

## Architecture Overview

```
project-root/
├── app.py                 # Core Service Orchestrator (starts frontend + backend)
├── .env                   # Unified Environment Configurations
├── backend/               # FastAPI backend application
│   ├── app/               # Core business, schemas, routes, models, middleware, repos
│   └── tests/             # Automated test suite
└── frontend/              # React + Vite frontend application (src/, public/)
```

## Getting Started

### Prerequisites

- Node.js (v18+) & npm
- Python (v3.10+) & pip

### Quick Start (Run Both Servers)

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Set Up Python Virtual Environment & Install Backend Dependencies:**
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   cd ..
   ```

3. **Configure Environment Variables:**
   A template is provided in [.env](file:///.env). Ensure your variables are set appropriately.

4. **Launch Application:**
   From the project root:
   ```bash
   python app.py
   ```
   This command starts the React frontend (Vite) and the FastAPI backend concurrently.
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000
   - **Interactive API Documentation:** http://localhost:8000/docs

---

## Running Automated Tests

To execute backend smoke tests:

```bash
cd backend
python -m pytest tests/ -v
```

