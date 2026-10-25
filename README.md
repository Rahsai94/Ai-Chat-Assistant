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

3. **Database Setup:**
   Initialize your PostgreSQL database and run the Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

4. **Development Server:**
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
- **Database:** PostgreSQL via Prisma
- **AI Integration:** Google Gemini API SDK (`@google/genai`)

### Requirements
- PostgreSQL with `pgvector` extension enabled.
## Deployment to Vercel

The application is configured to be deployed seamlessly to Vercel.

### Prerequisites

1.  **Vercel Account:** A Vercel account linked to your Git provider (GitHub, GitLab, or Bitbucket).
2.  **PostgreSQL Database:** A publicly accessible PostgreSQL database (e.g., Vercel Postgres, Supabase, Neon).
3.  **Gemini API Key:** A valid API key from Google AI Studio.

### Required Environment Variables (Production)

You must configure the following environment variables in your Vercel project settings *before* deploying:

*   `DATABASE_URL`: The connection string for your production PostgreSQL database. **Note:** Vercel requires connection pooling for serverless environments (typically using Prisma Accelerate or PgBouncer in Supabase/Neon). Adjust the URL or use connection pooling accordingly.
*   `GEMINI_API_KEY`: Your production Gemini API key. This is a secure server-side secret and must not be exposed to the client.
*   `GEMINI_MODEL`: (Optional) The model to use (e.g., `gemini-2.5-flash`). Defaults to `gemini-2.5-flash`.
*   `NEXTAUTH_SECRET`: A strong, randomly generated string. You can generate one using `openssl rand -base64 32`.
*   `NEXTAUTH_URL`: The canonical URL of your deployed application (e.g., `https://your-app.vercel.app`).
*   `KV_REST_API_URL` & `KV_REST_API_TOKEN`: (Optional) If you are using Upstash Redis for rate limiting, provide these credentials.

### Deployment Steps

1.  **Push to Git:** Ensure your code is pushed to a repository on GitHub, GitLab, or Bitbucket.
2.  **Import Project:** Go to the Vercel dashboard and click "Add New..." -> "Project". Import your repository.
3.  **Configure Project:**
    *   **Framework Preset:** Vercel should automatically detect **Next.js**.
    *   **Build Command:** Vercel defaults to `next build`. This is correct.
    *   **Install Command:** Vercel defaults to `npm install`. This is correct.
    *   **Environment Variables:** Add all the required production environment variables listed above.
4.  **Deploy:** Click "Deploy".

### Database Migrations in Production

For serverless deployments like Vercel, the `postinstall` script or Vercel Build Command should ideally handle migrations if they are safe to run automatically. Alternatively, run migrations locally against your production database before deploying code that depends on the new schema:

```bash
DATABASE_URL="your_production_db_url" npx prisma migrate deploy
```
*Note: Do not run `migrate dev` against a production database.*

### Production Smoke-Test Checklist

After deploying, verify the following:

- [ ] **Home Page:** Loads correctly without errors.
- [ ] **Chat Interface:** You can initiate a new chat.
- [ ] **AI Response:** Sending a message successfully returns a streamed response from the Gemini API.
- [ ] **History:** Refreshing the page or opening a new tab correctly loads past conversations (if persistent sessions are configured) or starts fresh correctly.
- [ ] **Error Handling:** Intentionally trigger an error (e.g. invalid query) to ensure the UI displays a friendly error message and no internal stack traces are leaked.
- [ ] **Rate Limiting:** (If configured) Send rapid messages to verify the rate limit blocks excessive requests gracefully.

## Known Limitations and Troubleshooting

*   **Streaming Timeouts:** Vercel's Hobby plan limits serverless function execution to 10 seconds (or 60 seconds on Pro). Streaming responses bypass some limits, but Next.js API routes handling the initial connection can time out. Ensure the application leverages Next.js App Router streaming effectively.
*   **Prisma Cold Starts:** In serverless environments, Prisma may take slightly longer to connect during cold starts. Using a connection pooler is highly recommended.
*   **Database Connections:** Vercel functions scale up concurrently. Without connection pooling, you may easily exhaust your PostgreSQL database connection limits.
*   **Failed Builds:** If type-checking fails during the build step, Vercel will halt deployment. Run `npm run typecheck` locally to catch errors early.
