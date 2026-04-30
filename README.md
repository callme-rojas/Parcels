# Travell Encomiendas 2026 — Parcels

Monorepo for the Travell Encomiendas parcel management platform.

## Project Structure

```
Parcels/
├── backend/    → NestJS + TypeScript + GraphQL (Apollo Server)
├── frontend/   → React + JavaScript + Mapbox GL JS + Apollo Client
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm run start:dev
```

The GraphQL Playground will be available at `http://localhost:3000/graphql`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will be available at `http://localhost:5173`.

## Tech Stack

### Backend
- **Node.js** — JavaScript runtime
- **NestJS** — Progressive Node.js framework
- **TypeScript** — Strongly typed JavaScript
- **GraphQL** — API query language (Apollo Server, code-first approach)

### Frontend
- **React** — UI library
- **JavaScript** — Language
- **Vite** — Build tool & dev server
- **Mapbox GL JS** — Interactive WebGL maps
- **Apollo Client** — GraphQL client
