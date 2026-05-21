import { useState } from 'react';
import { Calculator, AlertCircle, CheckCircle2, TrendingUp, ChevronDown } from 'lucide-react';
import { useCourses } from '../context/CourseContext';

interface SubjectMetrics {
  attendance: number;
  assignments: number;
  quizzes: number;
  studyHours: number;
}

export function PredictionTool() {
  const { courses } = useCourses();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? '');
  const [metrics, setMetrics] = useState<SubjectMetrics>({
    attendance: 85,
    assignments: 88,
    quizzes: 82,
    studyHours: 6,
  });
  const [prediction, setPrediction] = useState<{
    grade: string;
    score: number;
    risk: 'Low' | 'Medium' | 'High';
    suggestions: string[];
  } | null>(null);

  const set = (key: keyof SubjectMetrics, val: number) =>
    setMetrics((m) => ({ ...m, [key]: val }));

  const calculate = () => {
    const score = Math.round(
      metrics.attendance * 0.2 +
      metrics.assignments * 0.35 +
      metrics.quizzes * 0.25 +
      Math.min(metrics.studyHours * 4, 20) * 0.2
    );

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    const risk: 'Low' | 'Medium' | 'High' = score < 70 ? 'High' : score < 80 ? 'Medium' : 'Low';

    const suggestions: string[] = [];
    if (metrics.attendance < 85) suggestions.push('Improve attendance — missing classes has a direct impact on your score.');
    if (metrics.assignments < 85) suggestions.push('Focus on assignment quality — they carry the most weight.');
    if (metrics.quizzes < 80) suggestions.push('Review quiz material regularly to improve retention.');
    if (metrics.studyHours < 8) suggestions.push('Aim for 8–10 study hours per week for best results.');
    if (suggestions.length === 0) suggestions.push('Great job! Keep maintaining your current performance.');

    setPrediction({ grade, score, risk, suggestions });
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Calculator className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Academic Performance Predictor</h1>
          <p className="mt-2 text-muted-foreground">
            Select a subject and enter your metrics to estimate your final grade
          </p>
        </div>

        {/* Subject Selector */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Subject</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses added yet. Add courses in the Course Hub first.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCourseId(c.id); setPrediction(null); }}
                  className={'rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ' +
                    (selectedCourseId === c.id
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-accent/50 hover:text-foreground'
                    )}
                >
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className={'mt-1 text-xs ' + (selectedCourseId === c.id ? 'text-accent' : 'text-muted-foreground')}>
                    {c.status}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Also allow free-form / custom subject via dropdown fallback */}
          {courses.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Or pick from dropdown:</span>
              <div className="relative">
                <select
                  value={selectedCourseId}
                  onChange={(e) => { setSelectedCourseId(e.target.value); setPrediction(null); }}
                  className="appearance-none rounded-lg border border-border bg-muted/30 py-1.5 pl-3 pr-8 text-sm focus:border-accent focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="mb-1 text-xl font-semibold">Your Metrics</h2>
            {selectedCourse && (
              <p className="mb-6 text-sm text-muted-foreground">for <span className="font-medium text-foreground">{selectedCourse.name}</span></p>
            )}

            <div className="space-y-6">
              <div>
                <label className="mb-2 flex items-center justify-between text-sm">
                  <span>Attendance Percentage</span>
                  <span className="font-semibold text-accent">{metrics.attendance}%</span>
                </label>
                <input type="range" min="0" max="100" value={metrics.attendance}
                  onChange={(e) => set('attendance', Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent" />
              </div>
              <div>
                <label className="mb-2 flex items-center justify-between text-sm">
                  <span>Assignment Marks (Average)</span>
                  <span className="font-semibold text-accent">{metrics.assignments}%</span>
                </label>
                <input type="range" min="0" max="100" value={metrics.assignments}
                  onChange={(e) => set('assignments', Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent" />
              </div>
              <div>
                <label className="mb-2 flex items-center justify-between text-sm">
                  <span>Quiz Marks (Average)</span>
                  <span className="font-semibold text-accent">{metrics.quizzes}%</span>
                </label>
                <input type="range" min="0" max="100" value={metrics.quizzes}
                  onChange={(e) => set('quizzes', Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent" />
              </div>
              <div>
                <label className="mb-2 flex items-center justify-between text-sm">
                  <span>Study Hours per Week</span>
                  <span className="font-semibold text-accent">{metrics.studyHours}h</span>
                </label>
                <input type="range" min="0" max="20" value={metrics.studyHours}
                  onChange={(e) => set('studyHours', Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent" />
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={!selectedCourseId}
              className="mt-8 w-full rounded-lg bg-accent py-3 font-medium text-accent-foreground transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-40"
            >
              Predict My Result
            </button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {prediction ? (
              <>
                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="mb-4 text-sm text-muted-foreground">
                    Predicted Final Grade{selectedCourse ? ` — ${selectedCourse.name}` : ''}
                  </div>
                  <div className="mb-2 text-7xl font-semibold text-accent">{prediction.grade}</div>
                  <div className="text-muted-foreground">Estimated score: {prediction.score}/100</div>
                </div>

                <div className={'rounded-2xl border p-6 ' + (
                  prediction.risk === 'Low' ? 'border-green-500/20 bg-green-500/5' :
                  prediction.risk === 'Medium' ? 'border-yellow-500/20 bg-yellow-500/5' :
                  'border-red-500/20 bg-red-500/5'
                )}>
                  <div className="flex items-center gap-3">
                    {prediction.risk === 'Low' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className={'h-5 w-5 ' + (prediction.risk === 'Medium' ? 'text-yellow-500' : 'text-red-500')} />
                    )}
                    <div>
                      <div className="font-semibold">Risk Level: {prediction.risk}</div>
                      <div className="text-sm text-muted-foreground">
                        {prediction.risk === 'Low' && "You're on track for success!"}
                        {prediction.risk === 'Medium' && 'Some improvements needed'}
                        {prediction.risk === 'High' && 'Immediate action required'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Suggestions</h3>
                  </div>
                  <div className="space-y-3">
                    {prediction.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
                        <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        <div className="text-sm">{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border bg-card">
                <div className="text-center">
                  <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Select a subject and adjust your metrics,<br />then click "Predict My Result"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info note — no fake accuracy % */}
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
          <div className="flex gap-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
            <div>
              <div className="mb-2 font-semibold">How it works</div>
              <p className="text-sm text-muted-foreground">
                This tool uses a weighted formula across attendance (20%), assignments (35%), quizzes (25%), and study hours (20%) to estimate a likely grade. The weightings are a starting point — a more personalised algorithm is in progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
