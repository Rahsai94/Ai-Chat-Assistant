# AI Chat Assistant

A responsive, full-stack AI chat application built with Next.js App Router, integrating Gemini API for conversational AI.

## Current Implementation Status
**Phase 1 Complete:**
- Next.js 16+ App Router initialization
- TypeScript (Strict Mode) and Tailwind CSS configured
- `shadcn/ui` initialized
- Testing environment (Vitest + React Testing Library) established
- `.env.example` created with required variables
- Basic Application Shell and Homepage implemented

## Setup Instructions

1. **Clone and Install:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and fill in your details:
   ```bash
   cp .env.example .env.local
   ```
   Ensure you provide a valid `DATABASE_URL` and `GEMINI_API_KEY`.

3. **Development Server:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to view the app.

4. **Testing and Linting:**
   - Run type checks: `npm run typecheck`
   - Run linter: `npm run lint`
   - Run tests: `npm run test`

## Architecture Overview
- **Frontend:** Next.js App Router, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL via Prisma (planned)
- **AI Integration:** Google Gemini API SDK (`@google/genai`)
