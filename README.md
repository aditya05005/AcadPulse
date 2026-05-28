
# AcadPulse

A student academic dashboard for course tracking, attendance, study timers, reminders, and progress insights.

## Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- React Router v7
- **Supabase** (Postgres + Auth)

## Getting Started

### 1. Clone and install

```bash
unzip academic-dashboard.zip
cd academic-dashboard
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema below
3. Go to **Project Settings → API**, copy your Project URL and anon key
4. Copy `.env.example` to `.env.local` and paste your values:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run

```bash
npm run dev
```

---

## Supabase SQL Schema

Run this once in the Supabase SQL Editor:

```sql
-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  email text,
  created_at timestamptz default now()
);

-- Courses
create table courses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  progress int default 0,
  deadline text,
  status text default 'Active',
  last_studied timestamptz,
  created_at timestamptz default now()
);

-- Resource links
create table resource_links (
  id text primary key,
  course_id text references courses(id) on delete cascade not null,
  label text not null,
  url text not null
);

-- Attendance
create table attendance (
  id text primary key,
  course_id text references courses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date timestamptz not null,
  status text not null,
  note text
);

-- Study sessions
create table study_sessions (
  id text primary key,
  course_id text references courses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date timestamptz not null,
  duration_seconds int not null
);

-- Reminders
create table reminders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text references courses(id) on delete set null,
  course_name text,
  type text,
  description text not null,
  due_date timestamptz not null,
  missed boolean default false
);

-- Row Level Security
alter table courses enable row level security;
alter table resource_links enable row level security;
alter table attendance enable row level security;
alter table study_sessions enable row level security;
alter table reminders enable row level security;

create policy "own courses" on courses for all using (auth.uid() = user_id);
create policy "own links" on resource_links for all using (
  course_id in (select id from courses where user_id = auth.uid())
);
create policy "own attendance" on attendance for all using (auth.uid() = user_id);
create policy "own sessions" on study_sessions for all using (auth.uid() = user_id);
create policy "own reminders" on reminders for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, email)
  values (new.id, split_part(new.email, '@', 1), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

> **Note:** In Supabase Dashboard → Authentication → Providers → Email, you can disable "Confirm email" while testing so you don't need to verify every signup.

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts        # Supabase client (reads from .env.local)
│   ├── db.ts              # All DB functions — only file that touches Supabase
│   └── types.ts           # Shared TypeScript types
├── app/
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── CourseContext.tsx
│   │   └── ThemeContext.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CourseHub.tsx
│   │   ├── PredictionTool.tsx
│   │   ├── Insights.tsx
│   │   ├── SignIn.tsx
│   │   └── NotFound.tsx
│   └── components/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       └── Layout.tsx
└── styles/
```
