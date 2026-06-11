# Frontend Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React + Tailwind frontend with Signal Dashboard (main view), Replay Mode, and Sim Trade Log.

**Architecture:** Vite + React 18 + Tailwind CSS. Three views rendered via React Router. Fetches from FastAPI backend at `/analyze` and `/history`. No auth required.

**Tech Stack:** React 18, Vite, Tailwind CSS 3, React Router 6, TypeScript

---

## File Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api.ts              # Fetch wrapper for backend
│   ├── types.ts            # TypeScript interfaces matching backend schemas
│   ├── components/
│   │   ├── VerdictBadge.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── ShockBanner.tsx
│   │   └── Navbar.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Replay.tsx
│   │   └── TradeLog.tsx
│   └── index.css
```

---

### Task 1: Project Scaffolding

- [ ] **Step 1: Create Vite React TypeScript project**

```bash
cd D:/clearsignal && npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend && npm install && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p && npm install react-router-dom
```

- [ ] **Step 3: Configure Tailwind**

- [ ] **Step 4: Configure Vite proxy to backend**

- [ ] **Step 5: Verify dev server starts**

```bash
cd frontend && npm run dev
```

- [ ] **Step 6: Commit**

---

### Task 2: Types & API Client

- [ ] **Step 1: Create TypeScript interfaces**
- [ ] **Step 2: Create API fetch wrapper**
- [ ] **Step 3: Commit**

---

### Task 3: Shared Components

- [ ] **Step 1: VerdictBadge component**
- [ ] **Step 2: ScoreCard component**
- [ ] **Step 3: ShockBanner component**
- [ ] **Step 4: Navbar component**
- [ ] **Step 5: Commit**

---

### Task 4: Dashboard Page

- [ ] **Step 1: Ticker search + signal display**
- [ ] **Step 2: Wire up /analyze API call**
- [ ] **Step 3: Commit**

---

### Task 5: Trade Log Page

- [ ] **Step 1: History table with /history API**
- [ ] **Step 2: CSV export button**
- [ ] **Step 3: Commit**

---

### Task 6: Replay Page (placeholder)

- [ ] **Step 1: Date picker + ticker + replay display**
- [ ] **Step 2: Commit**

---

### Task 7: App Shell & Routing

- [ ] **Step 1: App.tsx with React Router**
- [ ] **Step 2: Verify all pages render**
- [ ] **Step 3: Commit**

---

### Task 8: Update Memory

- [ ] **Step 1: Update context/MEMORY.md**
- [ ] **Step 2: Update Claude persistent memory**
