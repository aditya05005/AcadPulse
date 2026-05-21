import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Target, BookOpen } from 'lucide-react';

const attendanceVsGrade = [
  { attendance: 60, grade: 65 },
  { attendance: 70, grade: 72 },
  { attendance: 75, grade: 76 },
  { attendance: 80, grade: 80 },
  { attendance: 85, grade: 85 },
  { attendance: 90, grade: 89 },
  { attendance: 95, grade: 93 },
  { attendance: 100, grade: 97 },
];

const assignmentImpact = [
  { month: 'Jan', submitted: 8, onTime: 7, grade: 78 },
  { month: 'Feb', submitted: 9, onTime: 9, grade: 82 },
  { month: 'Mar', submitted: 10, onTime: 9, grade: 85 },
  { month: 'Apr', submitted: 9, onTime: 8, grade: 83 },
  { month: 'May', submitted: 10, onTime: 10, grade: 88 },
];

const studyTrends = [
  { week: 'Week 1', hours: 5, productivity: 70 },
  { week: 'Week 2', hours: 6, productivity: 75 },
  { week: 'Week 3', hours: 7, productivity: 80 },
  { week: 'Week 4', hours: 6, productivity: 78 },
  { week: 'Week 5', hours: 8, productivity: 85 },
  { week: 'Week 6', hours: 7, productivity: 82 },
];

const subjectPerformance = [
  { subject: 'Math', current: 85, target: 90 },
  { subject: 'Physics', current: 78, target: 85 },
  { subject: 'CS', current: 92, target: 95 },
  { subject: 'English', current: 88, target: 90 },
  { subject: 'History', current: 81, target: 85 },
];

export function Insights() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Academic Insights</h1>
          <p className="mt-2 text-muted-foreground">
            Deep dive into your performance metrics and trends
          </p>
        </div>

        {/* Key Insights Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="text-2xl font-semibold">+12%</div>
            <div className="text-sm text-muted-foreground">Performance Growth</div>
            <div className="mt-2 text-xs text-muted-foreground">vs last semester</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div className="text-2xl font-semibold">89%</div>
            <div className="text-sm text-muted-foreground">Avg Attendance</div>
            <div className="mt-2 text-xs text-muted-foreground">Above target</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div className="text-2xl font-semibold">4/5</div>
            <div className="text-sm text-muted-foreground">Goals Achieved</div>
            <div className="mt-2 text-xs text-muted-foreground">This month</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div className="text-2xl font-semibold">42h</div>
            <div className="text-sm text-muted-foreground">Study Time</div>
            <div className="mt-2 text-xs text-muted-foreground">This month</div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Attendance vs Grade Correlation */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Attendance vs Grade Correlation</h3>
              <p className="text-sm text-muted-foreground">
                How your attendance directly impacts your final grade
              </p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={attendanceVsGrade}>
                <defs>
                  <linearGradient id="colorGradeInsights" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="attendance" 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Attendance %', position: 'insideBottom', offset: -5, style: { fill: 'var(--muted-foreground)', fontSize: '12px' } }}
                />
                <YAxis 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Grade', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: '12px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="grade" 
                  stroke="var(--accent)" 
                  strokeWidth={2}
                  fill="url(#colorGradeInsights)"
                  name="Grade"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Assignment Impact */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Assignment Impact on Grade</h3>
              <p className="text-sm text-muted-foreground">
                Submission rate and punctuality correlation
              </p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={assignmentImpact}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="month" 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="submitted" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Submitted"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="onTime" 
                  stroke="var(--accent)" 
                  strokeWidth={2}
                  name="On Time"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Study Trends */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Weekly Study Trends</h3>
              <p className="text-sm text-muted-foreground">
                Study hours and productivity over time
              </p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={studyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="week" 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="var(--accent)" 
                  radius={[8, 8, 0, 0]}
                  name="Study Hours"
                />
                <Bar 
                  dataKey="productivity" 
                  fill="#82ca9d" 
                  radius={[8, 8, 0, 0]}
                  name="Productivity %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Performance: Current vs Target */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Subject Performance: Current vs Target</h3>
              <p className="text-sm text-muted-foreground">
                Track your progress towards your goals
              </p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  type="number" 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="subject" 
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar 
                  dataKey="current" 
                  fill="var(--accent)" 
                  radius={[0, 8, 8, 0]}
                  name="Current"
                />
                <Bar 
                  dataKey="target" 
                  fill="#82ca9d" 
                  radius={[0, 8, 8, 0]}
                  name="Target"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Summary */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-8">
          <h3 className="mb-6 text-lg font-semibold">Key Takeaways</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                <div className="text-sm">
                  <span className="font-medium">Strong correlation</span> between attendance and final grades. 
                  Students with 90%+ attendance score 15% higher on average.
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                <div className="text-sm">
                  <span className="font-medium">Consistent study habits</span> (7-8 hours/week) show better 
                  results than cramming before exams.
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                <div className="text-sm">
                  <span className="font-medium">On-time submissions</span> are crucial. Late assignments 
                  reduce your grade by 10-15% on average.
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                <div className="text-sm">
                  <span className="font-medium">Early intervention</span> in struggling subjects shows 
                  40% better outcomes than last-minute efforts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}