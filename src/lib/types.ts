// ─── Shared Types ─────────────────────────────────────────────────────────────
// Single source of truth for all data shapes used across the app.
// When connecting a real database, these types map directly to your DB schema.

export interface ResourceLink {
  id: string;
  label: string;
  url: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO date string
  status: 'attended' | 'missed';
  note?: string;
}

export interface StudySession {
  id: string;
  date: string; // ISO date string
  durationSeconds: number;
}

export interface Course {
  id: string;
  name: string;
  progress: number;
  deadline: string;
  status: 'Active' | 'Steady' | 'Cold';
  links: ResourceLink[];
  lastStudied?: string; // ISO date string
  attendance: AttendanceRecord[];
  studySessions: StudySession[];
  createdAt: string;
}

export type ReminderType = 'test' | 'assignment' | 'deadline' | 'custom';

export interface Reminder {
  id: string;
  type: ReminderType;
  courseId?: string; // references Course.id
  courseName?: string;
  description: string;
  dueDate: string;  // ISO date string
  daysUntil?: number;
  missed?: boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}
