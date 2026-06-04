# JobProfile - Career Profile Builder

JobProfile is a small multilingual service for creating public professional profiles.

Each user can create one or more profiles with:

- basic professional information;
- downloadable resume with a public visibility toggle;
- profile photo;
- portfolio projects with multiple external links;
- certificates;
- public/private links such as LinkedIn, GitHub, YouTube, Facebook, or a personal website.

Visitors can search specialists, open a public profile link, view the portfolio online, and download the resume only if the owner allows it.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Next.js Server Actions, API routes |
| Database | Turso/libSQL via `@libsql/client` |
| Auth | JWT httpOnly cookies, bcryptjs, Google OAuth |
| Files | Private Vercel Blob storage |
| Deployment | Vercel |

## Local Development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The app requires Turso and Vercel Blob credentials even in local development because runtime data is no longer stored on the local filesystem.

## Environment Variables

Create `.env.local` for local development and add the same variables in Vercel:

```bash
JWT_SECRET=change-this-to-a-random-secret-at-least-32-characters
TURSO_DATABASE_URL=libsql://your-database-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-turso-token
BLOB_READ_WRITE_TOKEN=your-vercel-blob-read-write-token
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

`JWT_SECRET` must be at least 32 characters and must not use the default placeholder in production.

`NEXT_PUBLIC_APP_URL` must match the deployed app origin without a trailing slash. For Google OAuth, add this redirect URI in Google Cloud:

```text
https://your-project.vercel.app/api/auth/google/callback
```

## Turso Setup

Create a Turso database, generate an auth token, and set:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

The application creates and updates the required tables automatically on first database access.

## Vercel Blob Setup

Create a Vercel Blob store for the project. Use a private store for user files.

Set:

- `BLOB_READ_WRITE_TOKEN`

Uploaded resumes, photos, project files, and certificate files are stored in private Blob storage. Browser access goes through `/api/files/...`, where the app checks whether the file belongs to the logged-in user or is allowed on a public profile.

## Deployment

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables listed above.
4. Create/connect Vercel Blob storage.
5. Deploy.

## Docker

Docker is kept only as an optional runtime wrapper. It still requires Turso and Vercel Blob environment variables:

```bash
docker compose up -d --build
```

On Windows where Docker works through Ubuntu WSL:

```bash
wsl -d Ubuntu
cd /mnt/c/Users/Admin/Desktop/career-profile-builder/career-profile-builder
docker compose up -d --build
```

The app is available at `http://localhost:3012`.

## Data Storage

Runtime data is stored outside the repo:

- profiles, users, links, projects, and certificates: Turso/libSQL;
- resumes, profile photos, portfolio files, and certificate files: private Vercel Blob.

There is no local SQLite database and no local uploads directory in production.
