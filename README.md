# JobProfile - Career Profile Builder

JobProfile is a small web service for creating public professional profiles.

Each user can create one or more profiles with:

- basic professional information;
- downloadable resume;
- profile photo;
- portfolio projects;
- certificates;
- public links such as LinkedIn, GitHub, YouTube, and Facebook.

Visitors can open a public profile link, view the information online, and download the resume if the owner allows it.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Next.js Server Actions, API routes |
| Database | SQLite via better-sqlite3 |
| Auth | JWT httpOnly cookies, bcryptjs |
| Files | Local uploads directory |
| Runtime | Docker / Docker Compose |

## Local Development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Docker Run

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

## Environment

Create a production secret before deployment:

```bash
JWT_SECRET=change-this-to-a-random-32-character-secret
```

## Persistent Data

The app stores runtime data in:

- `data/` - SQLite database;
- `uploads/` - resumes, profile photos, portfolio files, and certificates.

These folders are intentionally ignored by Git.

## Deployment Note

This MVP uses SQLite and local file uploads, so it needs persistent disk storage.

Serverless platforms such as Vercel are not a good fit without changing storage to something like Supabase Postgres + Supabase Storage, because local database and upload files are not persistent there.

For a simple Docker deployment, use a host that supports persistent volumes.
