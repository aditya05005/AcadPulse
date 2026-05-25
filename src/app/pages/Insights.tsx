import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, BookOpen, Clock } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import type { Course } from '../../lib/types';

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

function formatCourseName(name: string): string {
  return name.length > 12 ? `${name.slice(0, 12)}...` : name;
}

function calculateAverageAttendance(courses: Course[]): number {
  const records = courses.flatMap((course) => course.attendance);
  if (!records.length) return 0;
  const attended = records.filter((record) => record.status === 'attended').length;
  return Math.round((attended / records.length) * 100);
}

function calculateAverageProgress(courses: Course[]): number {
  if (!courses.length) return 0;
  return Math.round(courses.reduce((total, course) => total + course.progress, 0) / courses.length);
}

function calculateStudyHoursThisMonth(courses: Course[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const totalSeconds = courses
    .flatMap((course) => course.studySessions)
    .filter((session) => new Date(session.date).getTime() >= monthStart)
    .reduce((sum, session) => sum + session.durationSeconds, 0);
  return Math.round((totalSeconds / 3600) * 10) / 10;
}

function calculateConsistencyScore(courses: Course[]): number {
  const weekStart = startOfWeek(new Date()).getTime();
  const studiedDays = new Set(
    courses
      .flatMap((course) => course.studySessions)
      .map((session) => new Date(session.date))
      .filter((date) => date.getTime() >= weekStart)
      .map((date) => date.toISOString().slice(0, 10))
  );
  return studiedDays.size;
}

function calculateWeeklyCourseStudyData(courses: Course[]) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return courses
    .map((course) => {
      const totalSeconds = course.studySessions
        .filter((session) => new Date(session.date).getTime() >= cutoff)
        .reduce((sum, session) => sum + session.durationSeconds, 0);
      return {
        course: formatCourseName(course.name),
        hours: Math.round((totalSeconds / 3600) * 10) / 10,
      };
    })
    .filter((course) => course.hours > 0);
}

function calculateProgressData(courses: Course[]) {
  return courses.map((course) => ({
    course: formatCourseName(course.name),
    progress: course.progress,
  }));
}

function calculateAttendanceData(courses: Course[]) {
  return courses
    .map((course) => {
      const total = course.attendance.length;
      const attended = course.attendance.filter((record) => record.status === 'attended').length;
      return {
        course: formatCourseName(course.name),
        attendance: total ? Math.round((attended / total) * 100) : 0,
      };
    })
    .filter((course) => course.attendance > 0);
}

function hasStudySessions(courses: Course[]): boolean {
  return courses.some((course) => course.studySessions.length > 0);
}

function formatStudyTooltip(value: number) {
  return [`${value}h`, 'Study Time'];
}

function formatPercentTooltip(value: number, label: string) {
  return [`${value}%`, label];
}

export function Insights() {
  const { courses, loading } = useCourses();

  const stats = useMemo(() => ({
    averageAttendance: calculateAverageAttendance(courses),
    averageProgress: calculateAverageProgress(courses),
    studyHoursThisMonth: calculateStudyHoursThisMonth(courses),
    consistencyScore: calculateConsistencyScore(courses),
    weeklyStudyByCourse: calculateWeeklyCourseStudyData(courses),
    progressByCourse: calculateProgressData(courses),
    attendanceByCourse: calculateAttendanceData(courses),
    hasStudyData: hasStudySessions(courses),
  }), [courses]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Academic Insights</h1>
          <p className="mt-2 text-muted-foreground">
            Real course metrics built from your tracked study sessions, attendance, and progress.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">Loading your insights…</div>
        ) : courses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-muted-foreground">
            <BookOpen className="h-8 w-8 opacity-40" />
            <p className="text-sm">No courses yet. Add courses and start tracking activity to populate insights.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div className="text-2xl font-semibold">{stats.averageProgress}%</div>
                <div className="text-sm text-muted-foreground">Average Progress</div>
                <div className="mt-2 text-xs text-muted-foreground">Across all courses</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div className="text-2xl font-semibold">{stats.averageAttendance}%</div>
                <div className="text-sm text-muted-foreground">Avg Attendance</div>
                <div className="mt-2 text-xs text-muted-foreground">Based on logged attendance</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="text-2xl font-semibold">{stats.studyHoursThisMonth}h</div>
                <div className="text-sm text-muted-foreground">Study Time</div>
                <div className="mt-2 text-xs text-muted-foreground">This month</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div className="text-2xl font-semibold">{stats.consistencyScore}/7</div>
                <div className="text-sm text-muted-foreground">Consistency Score</div>
                <div className="mt-2 text-xs text-muted-foreground">Days studied this week</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Weekly Study Time by Course</h3>
                  <p className="text-sm text-muted-foreground">Total hours logged in the last 7 days.</p>
                </div>
                {stats.weeklyStudyByCourse.length === 0 ? (
                  <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    {stats.hasStudyData ? 'No study sessions in the last 7 days.' : 'No study sessions logged yet.'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.weeklyStudyByCourse}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="course" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                        formatter={formatStudyTooltip}
                      />
                      <Bar dataKey="hours" fill="var(--accent)" radius={[8, 8, 0, 0]} name="Study Time" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Progress by Course</h3>
                  <p className="text-sm text-muted-foreground">Saved progress values for each active course.</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.progressByCourse}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="course" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                      formatter={(value: number) => formatPercentTooltip(value, 'Progress')}
                    />
                    <Bar dataKey="progress" fill="var(--accent)" radius={[8, 8, 0, 0]} name="Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Attendance by Course</h3>
                  <p className="text-sm text-muted-foreground">Percentage of attended classes per course.</p>
                </div>
                {stats.attendanceByCourse.length === 0 ? (
                  <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    No attendance records logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.attendanceByCourse}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="course" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                        formatter={(value: number) => formatPercentTooltip(value, 'Attendance')}
                      />
                      <Bar dataKey="attendance" fill="#82ca9d" radius={[8, 8, 0, 0]} name="Attendance" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
