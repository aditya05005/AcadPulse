import { Link } from 'react-router';
import { ArrowRight, Brain, TrendingUp, CheckCircle2, Calendar, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useCourses } from '../context/CourseContext';

export function Landing() {
  const { courses } = useCourses();

  const getStatusColor = (status: string) => {
    if (status === 'On Track') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (status === 'Behind') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
  };

  const cardColors = [
    { color: 'from-red-500/10 to-red-600/5', borderColor: 'border-red-500/20' },
    { color: 'from-blue-500/10 to-blue-600/5', borderColor: 'border-blue-500/20' },
    { color: 'from-purple-500/10 to-purple-600/5', borderColor: 'border-purple-500/20' },
    { color: 'from-accent/10 to-accent/5', borderColor: 'border-accent/20' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Content */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground w-fit">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></div>
                Your Academic Command Center
              </div>

              <h1 className="mt-8 text-4xl font-semibold tracking-tight lg:text-6xl">
                Stay on top of{' '}
                <span className="text-accent">your academics.</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Track attendance, study time, deadlines, and course progress all in one place.
                Know where you stand before results day.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 hover:shadow-lg"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium transition-all hover:bg-muted"
                >
                  Explore Courses
                </Link>
              </div>

              {/* Stats — no fake accuracy numbers */}
              <div className="mt-12 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl font-semibold">{courses.length}</div>
                  <div className="text-sm text-muted-foreground">Courses tracked</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">
                    {courses.filter((c) => c.status === 'On Track').length}
                  </div>
                  <div className="text-sm text-muted-foreground">On track</div>
                </div>
              </div>
            </div>

            {/* Right: Dashboard Preview */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Academic Overview</div>
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
                </div>
                <div className="mb-6">
                  <div className="text-5xl font-semibold">
                    {courses.length > 0 ? Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">avg. progress across courses</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                    <span className="text-sm">Courses</span>
                    <span className="text-sm font-medium">{courses.length} active</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                    <span className="text-sm">Urgent</span>
                    <span className="text-sm font-medium text-rose-500">
                      {courses.filter((c) => c.status === 'Urgent').length} course{courses.filter((c) => c.status === 'Urgent').length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                    <span className="text-sm">Study sessions logged</span>
                    <span className="text-sm font-medium">
                      {courses.reduce((a, c) => a + c.studySessions.length, 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Hub Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-card">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm text-accent mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              Course Management
            </div>
            <h2 className="text-3xl font-semibold tracking-tight lg:text-5xl">
              All Your Courses. One Place.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Track courses, deadlines, and progress in one dashboard. Start timers, log attendance, and never miss a deadline again.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {courses.slice(0, 4).map((course, i) => {
              const { color, borderColor } = cardColors[i % cardColors.length];
              return (
                <div key={course.id}
                  className={'group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-accent/10 ' + borderColor + ' ' + color}>
                  <div className="absolute top-4 right-4">
                    <span className={'rounded-full border px-3 py-1 text-xs font-medium ' + getStatusColor(course.status)}>
                      {course.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 pr-16">{course.name}</h3>
                  </div>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{course.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-background/60">
                      <div className="h-full rounded-full bg-accent transition-all duration-500 shadow-lg shadow-accent/50" style={{ width: course.progress + '%' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link to="/courses"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium transition-all hover:bg-muted hover:border-accent hover:shadow-lg">
              View All Courses
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Everything you need to succeed</h2>
            <p className="mt-4 text-lg text-muted-foreground">Powerful features to help you stay on top of your academic performance</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-border bg-background p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Track Progress</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Keep course progress current so your dashboard reflects where each subject actually stands.
              </p>
            </div>
            <div className="group rounded-2xl border border-border bg-background p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Track Attendance</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Mark attended and missed classes per course. See how your attendance affects your academic standing.
              </p>
            </div>
            <div className="group rounded-2xl border border-border bg-background p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Smart Reminders</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Set custom reminders for tests, assignments, and deadlines. Never miss an important date again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Trusted by students</h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { quote: 'This helped me identify weak areas early. I improved my study habits and ended up with an A!', name: 'Sarah Chen', role: 'Computer Science Student' },
              { quote: 'The course tracker is exactly what I needed. Logging attendance and study time keeps me accountable.', name: 'Marcus Johnson', role: 'Business Major' },
              { quote: 'The reminders keep my semester organized. I always know what needs attention next.', name: 'Emma Rodriguez', role: 'Engineering Student' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-8">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => <CheckCircle2 key={j} className="h-4 w-4 fill-accent text-accent" />)}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">"{t.quote}"</p>
                <div className="mt-6">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="rounded-3xl border border-border bg-background p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Ready to take control of your semester?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Start tracking and stay ahead with AcadPulse</p>
            <div className="mt-8">
              <Link to="/signin" className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 hover:shadow-lg">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
