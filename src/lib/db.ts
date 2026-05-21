/**
 * ─── db.ts — Supabase persistence layer ──────────────────────────────────────
 *
 * Single source of truth for all DB access. No localStorage anywhere.
 *
 * CAMELCASE ↔ SNAKE_CASE
 * Frontend uses camelCase. Postgres uses snake_case.
 * Every function converts via toRow / fromRow helpers.
 *
 * IDs
 * All table IDs are TEXT in Postgres.
 * Always generate with crypto.randomUUID() before calling any save function.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase';
import type {
  Course, Reminder, User, ResourceLink, AttendanceRecord, StudySession,
} from './types';

// ── Utilities ─────────────────────────────────────────────────────────────────

export const newId = (): string => crypto.randomUUID();

function assert(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`[db/${context}] ${error.message}`);
}

/**
 * Reads the user ID from the LOCAL in-memory session — no network call.
 * (getUser() was the old approach and caused an extra round-trip per operation.)
 */
async function uid(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('[db/uid] No authenticated session.');
  return session.user.id;
}

// ── Row types (exact snake_case column names from Postgres) ───────────────────

interface ResourceLinkRow {
  id: string; course_id: string; label: string; url: string;
}
interface AttendanceRow {
  id: string; course_id: string; user_id: string;
  date: string; status: 'attended' | 'missed'; note: string | null;
}
interface StudySessionRow {
  id: string; course_id: string; user_id: string;
  date: string; duration_seconds: number;
}
interface CourseRow {
  id: string; user_id: string; name: string; progress: number;
  deadline: string; status: string; last_studied: string | null;
  created_at: string;
  resource_links?: ResourceLinkRow[];
  attendance?: AttendanceRow[];
  study_sessions?: StudySessionRow[];
}
interface ReminderRow {
  id: string; user_id: string; course_id: string | null;
  course_name: string | null; type: string; description: string;
  due_date: string; missed: boolean;
}
interface ProfileRow {
  id: string; username: string; email: string | null; created_at: string;
}

// ── DB row → frontend type ────────────────────────────────────────────────────

const linkFromRow    = (r: ResourceLinkRow): ResourceLink =>
  ({ id: r.id, label: r.label, url: r.url });

const attendanceFromRow = (r: AttendanceRow): AttendanceRecord =>
  ({ id: r.id, date: r.date, status: r.status, note: r.note ?? undefined });

const sessionFromRow = (r: StudySessionRow): StudySession =>
  ({ id: r.id, date: r.date, durationSeconds: r.duration_seconds });

const courseFromRow  = (r: CourseRow): Course => ({
  id: r.id, name: r.name, progress: r.progress, deadline: r.deadline,
  status: r.status as Course['status'],
  lastStudied: r.last_studied ?? undefined,
  createdAt: r.created_at,
  links:        (r.resource_links ?? []).map(linkFromRow),
  attendance:   (r.attendance     ?? []).map(attendanceFromRow),
  studySessions:(r.study_sessions ?? []).map(sessionFromRow),
});

const reminderFromRow = (r: ReminderRow): Reminder => ({
  id: r.id,
  type: r.type as Reminder['type'],
  courseId:   r.course_id   ?? undefined,
  courseName: r.course_name ?? undefined,
  description: r.description,
  dueDate: r.due_date,
  missed:  r.missed,
  daysUntil: Math.round((new Date(r.due_date).getTime() - Date.now()) / 86400000),
});

const userFromProfile = (p: ProfileRow): User => ({
  id: p.id, username: p.username,
  email: p.email ?? undefined, createdAt: p.created_at,
});

// ── Frontend type → DB row ────────────────────────────────────────────────────

const linkToRow = (courseId: string, l: ResourceLink): ResourceLinkRow =>
  ({ id: l.id, course_id: courseId, label: l.label, url: l.url });

const attendanceToRow = (
  courseId: string, userId: string, r: AttendanceRecord
): AttendanceRow => ({
  id: r.id, course_id: courseId, user_id: userId,
  date: r.date, status: r.status, note: r.note ?? null,
});

const sessionToRow = (
  courseId: string, userId: string, s: StudySession
): StudySessionRow => ({
  id: s.id, course_id: courseId, user_id: userId,
  date: s.date, duration_seconds: s.durationSeconds,
});

const courseToRow = (
  userId: string, c: Course
): Omit<CourseRow, 'resource_links' | 'attendance' | 'study_sessions'> => ({
  id: c.id, user_id: userId, name: c.name, progress: c.progress,
  deadline: c.deadline, status: c.status,
  last_studied: c.lastStudied ?? null,
  created_at: c.createdAt,
});

const reminderToRow = (userId: string, r: Reminder): ReminderRow => ({
  id: r.id, user_id: userId,
  course_id:   r.courseId   ?? null,
  course_name: r.courseName ?? null,
  type: r.type, description: r.description,
  due_date: r.dueDate,
  missed: r.missed ?? new Date(r.dueDate) < new Date(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

/** Read session from memory, then fetch the profile row. No extra network call. */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', session.user.id).single();
  if (error || !data) return null;
  return userFromProfile(data as ProfileRow);
}

export async function signIn(email: string, password: string): Promise<User> {
  console.log("This is from db.ts, signIn function", email, password);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log("Got either data or error", data, error);
  assert(error, 'signIn');

  const { data: profile, error: pe } = await supabase   
    .from('profiles').select('*').eq('id', data.user!.id).single();
  assert(pe, 'signIn/profile');

  return userFromProfile(profile as ProfileRow);
}

export async function signUp(
  email: string, password: string, username: string
): Promise<User> {
  // Pass username in options.data so the DB trigger (handle_new_user) picks it
  // up directly via raw_user_meta_data->>'username' — no race condition.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  assert(error, 'signUp');

  // If email confirmation is ON, there's no session yet — return a stub.
  // The profile row was already created by the DB trigger.
  if (!data.session) {
    return {
      id: data.user!.id,
      username,
      email,
      createdAt: new Date().toISOString(),
    };
  }

  // Confirmation OFF (dev mode): session is active, upsert profile as safety net.
  const { error: pe } = await supabase.from('profiles').upsert({
    id: data.user!.id, username, email,
    created_at: new Date().toISOString(),
  });
  assert(pe, 'signUp/profile');

  return { id: data.user!.id, username, email, createdAt: new Date().toISOString() };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  assert(error, 'signOut');
}

// ═══════════════════════════════════════════════════════════════════════════════
// COURSES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, resource_links(*), attendance(*), study_sessions(*)')
    .order('created_at', { ascending: true });
  assert(error, 'getCourses');
  return (data as CourseRow[]).map(courseFromRow);
}

export async function upsertCourse(course: Course): Promise<void> {
  const userId = await uid();
  const { error } = await supabase.from('courses').upsert(courseToRow(userId, course));
  assert(error, 'upsertCourse');
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  assert(error, 'deleteCourse');
}

// ─── Resource links ───────────────────────────────────────────────────────────

export async function insertResource(courseId: string, link: ResourceLink): Promise<void> {
  const { error } = await supabase
    .from('resource_links').insert(linkToRow(courseId, link));
  assert(error, 'insertResource');
}

export async function deleteResource(linkId: string): Promise<void> {
  const { error } = await supabase.from('resource_links').delete().eq('id', linkId);
  assert(error, 'deleteResource');
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function insertAttendance(
  courseId: string, record: AttendanceRecord
): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('attendance').insert(attendanceToRow(courseId, userId, record));
  assert(error, 'insertAttendance');
}

// ─── Study sessions ───────────────────────────────────────────────────────────

export async function insertStudySession(
  courseId: string, session: StudySession
): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('study_sessions').insert(sessionToRow(courseId, userId, session));
  assert(error, 'insertStudySession');
}

export async function updateLastStudied(courseId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('courses').update({ last_studied: date }).eq('id', courseId);
  assert(error, 'updateLastStudied');
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders').select('*').order('due_date', { ascending: true });
  assert(error, 'getReminders');
  return (data as ReminderRow[]).map(reminderFromRow);
}

export async function upsertReminder(reminder: Reminder): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('reminders').upsert(reminderToRow(userId, reminder));
  assert(error, 'upsertReminder');
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  assert(error, 'deleteReminder');
}
