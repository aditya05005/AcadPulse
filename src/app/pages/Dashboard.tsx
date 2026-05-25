import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, BookOpen, Clock, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import type { Course } from '../../lib/types';

// ── Stat helpers ───────────────────────────────────────────────────────────────

function calcAttendancePct(courses: Course[]): number {
  const all = courses.flatMap((c) => c.attendance);
  if (!all.length) return 0;
  const attended = all.filter((r) => r.status === 'attended').length;
  return Math.round((attended / all.length) * 100);
}

function calcStudyHoursThisWeek(courses: Course[]): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const secs = courses
    .flatMap((c) => c.studySessions)
    .filter((s) => new Date(s.date).getTime() >= cutoff)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
  return Math.round((secs / 3600) * 10) / 10;
}

function calcAvgProgress(courses: Course[]): number {
  if (!courses.length) return 0;
  return Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length);
}

function calcHealthScore(courses: Course[]): number {
  if (!courses.length) return 0;
  const att   = calcAttendancePct(courses);
  const prog  = calcAvgProgress(courses);
  const study = Math.min(calcStudyHoursThisWeek(courses) / 10, 1) * 100;
  return Math.round(att * 0.4 + prog * 0.4 + study * 0.2);
}

function buildAttendanceTrend(courses: Course[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const w = 5 - i;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const records = courses
      .flatMap((c) => c.attendance)
      .filter((r) => {
        const d = new Date(r.date).getTime();
        return d >= weekStart.getTime() && d < weekEnd.getTime();
      });

    const pct = records.length
      ? Math.round((records.filter((r) => r.status === 'attended').length / records.length) * 100)
      : 0;

    return { week: `W${6 - w}`, attendance: pct };
  });
}

function buildPerformanceData(courses: Course[]) {
  return courses.map((c) => ({
    subject: c.name.length > 10 ? c.name.slice(0, 10) + '\u2026' : c.name,
    score: c.progress,
  }));
}

function buildRecentActivity(courses: Course[]) {
  type Item = { type: 'study' | 'attendance' | 'course'; label: string; sub: string; date: Date };
  const items: Item[] = [];

  courses.forEach((c) => {
    c.studySessions.forEach((s) => {
      const mins = Math.round(s.durationSeconds / 60);
      items.push({
        type: 'study',
        label: `Studied ${c.name}`,
        sub: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m session` : `${mins}m session`,
        date: new Date(s.date),
      });
    });
    c.attendance.forEach((r) => {
      items.push({
        type: 'attendance',
        label: r.status === 'attended' ? `Attended ${c.name}` : `Missed ${c.name}`,
        sub: r.note || (r.status === 'attended' ? 'Marked present' : 'Marked absent'),
        date: new Date(r.date),
      });
    });
    items.push({
      type: 'course',
      label: `Added course: ${c.name}`,
      sub: `Deadline: ${c.deadline}`,
      date: new Date(c.createdAt),
    });
  });

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return 'Yesterday';
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ACTIVITY_ICON = { study: BookOpen, attendance: Calendar, course: FileText };

// ── Component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth();
  const { courses, loading } = useCourses();

  const stats = useMemo(() => ({
    healthScore:  calcHealthScore(courses),
    attendancePct: calcAttendancePct(courses),
    studyHours:   calcStudyHoursThisWeek(courses),
    avgProgress:  calcAvgProgress(courses),
    trend:        buildAttendanceTrend(courses),
    performance:  buildPerformanceData(courses),
    activity:     buildRecentActivity(courses),
  }), [courses]);

  const displayName = user?.username ?? 'there';
  const circumference = 2 * Math.PI * 56;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {displayName}</h1>
          <p className="mt-2 text-muted-foreground">Here's your academic performance overview</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">Loading your stats…</div>
        ) : courses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-muted-foreground">
            <BookOpen className="h-8 w-8 opacity-40" />
            <p className="text-sm">No courses yet — add one in the Courses tab to see your stats.</p>
          </div>
        ) : (
          <>
            {/* Main Score Card */}
            <div className="mb-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Academic Health Score</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-6xl font-semibold text-accent">{stats.healthScore}</div>
                    <div className="text-2xl text-muted-foreground">/ 100</div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Based on attendance, progress &amp; study time
                  </div>
                </div>
                <div className="relative h-32 w-32">
                  <svg className="h-32 w-32 -rotate-90 transform">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-border" />
                    <circle
                      cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - stats.healthScore / 100)}
                      strokeLinecap="round"
                      className="text-accent transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold">{stats.healthScore}%</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { icon: Calendar,   value: `${stats.attendancePct}%`, label: 'Attendance' },
                { icon: TrendingUp, value: `${stats.avgProgress}%`,   label: 'Avg Progress' },
                { icon: Clock,      value: `${stats.studyHours}h`,    label: 'Study This Week' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-6 transition-all hover:border-accent">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{value}</div>
                      <div className="text-sm text-muted-foreground">{label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-6 text-lg font-semibold">Attendance Trend</h3>
                {stats.trend.every((w) => w.attendance === 0) ? (
                  <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">No attendance records yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={stats.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="week" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} formatter={(v: number) => [`${v}%`, 'Attendance']} />
                      <Line type="monotone" dataKey="attendance" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} name="Attendance" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-6 text-lg font-semibold">Progress by Course</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="subject" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} formatter={(v: number) => [`${v}%`, 'Progress']} />
                    <Bar dataKey="score" fill="var(--accent)" radius={[8, 8, 0, 0]} name="Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-6 text-lg font-semibold">Recent Activity</h3>
              {stats.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet — start tracking attendance or study sessions.</p>
              ) : (
                <div className="space-y-4">
                  {stats.activity.map((item, i) => {
                    const Icon = ACTIVITY_ICON[item.type];
                    return (
                      <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.label}</div>
                          <div className="text-sm text-muted-foreground truncate">{item.sub}</div>
                        </div>
                        <div className="shrink-0 text-sm text-muted-foreground">{timeAgo(item.date)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
