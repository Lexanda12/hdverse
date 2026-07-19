# HD Verse

Africa's creative IP infrastructure platform.

## Monorepo Structure

- `apps/api`: Express + TypeScript backend.
- `apps/web`: React + Vite + TypeScript frontend.
- `packages/shared-types`: Common TypeScript definitions shared between apps.

## Prerequisites

- Node.js (>= 20.0.0)
- npm (>= 10.0.0)
- Docker & Docker Compose

## Quick Start

1. Start database and cache:
   ```bash
   docker-compose up -d
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development servers:
   - Backend API: `npm run dev --workspace=apps/api`
   - Frontend Web: `npm run dev --workspace=apps/web`
