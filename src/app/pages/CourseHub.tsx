import { useState, useEffect, useRef } from 'react';
import {
  Plus, ExternalLink, Calendar, AlertCircle, CheckCircle2, Clock,
  ArrowLeft, Play, Square, Link as LinkIcon, Trash2, X,
  UserCheck, UserX, Bell, Loader2,
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import type { Course, ResourceLink, AttendanceRecord, StudySession, Reminder } from '../../lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastStudied(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return diff + ' days ago';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimer(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function formatReminderDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Missed';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getStatusColor(status: Course['status']) {
  if (status === 'On Track') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (status === 'Behind') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
}

// ─── Course Detail ─────────────────────────────────────────────────────────────

function CourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const { updateLastStudied, markAttendance, addResource, removeResource, courses } = useCourses();

  // Timer
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const [saved, setSaved] = useState(false);
  const [timerError, setTimerError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) intervalRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStop = async () => {
    setRunning(false);
    if (secs > 0) {
      const session: StudySession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        durationSeconds: secs,
      };
      try {
        await updateLastStudied(course.id, new Date().toISOString(), session);
        setSaved(true);
        setTimerError('');
      } catch (e) {
        setTimerError(e instanceof Error ? e.message : 'Failed to save session.');
      }
    }
  };

  // Attendance
  const [attendNote, setAttendNote] = useState('');
  const [attendSaving, setAttendSaving] = useState(false);
  const [attendError, setAttendError] = useState('');

  const handleAttend = async (status: 'attended' | 'missed') => {
    const record: AttendanceRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      status,
      note: attendNote.trim() || undefined,
    };
    setAttendSaving(true);
    setAttendError('');
    try {
      await markAttendance(course.id, record);
      setAttendNote('');
    } catch (e) {
      setAttendError(e instanceof Error ? e.message : 'Failed to save attendance.');
    } finally {
      setAttendSaving(false);
    }
  };

  // Live course data from context
  const live = courses.find((c) => c.id === course.id) ?? course;
  const attendedCount = live.attendance.filter((a) => a.status === 'attended').length;
  const missedCount = live.attendance.filter((a) => a.status === 'missed').length;
  const totalAttend = attendedCount + missedCount;
  const attendPct = totalAttend > 0 ? Math.round((attendedCount / totalAttend) * 100) : null;

  // Add resource
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState('');

  const handleAddResource = async () => {
    if (!newLink.label || !newLink.url) return;
    const link: ResourceLink = {
      id: crypto.randomUUID(),
      label: newLink.label.trim(),
      url: ensureProtocol(newLink.url.trim()),
    };
    setLinkSaving(true);
    setLinkError('');
    try {
      await addResource(course.id, link);
      setNewLink({ label: '', url: '' });
      setShowAddLink(false);
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Failed to save link.');
    } finally {
      setLinkSaving(false);
    }
  };

  const handleRemoveResource = async (linkId: string) => {
    try {
      await removeResource(course.id, linkId);
    } catch (e) {
      console.error('Failed to remove resource:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to Course Hub
        </button>

        {/* Header */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{live.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Most recently studied: <span className="font-medium text-foreground">{formatLastStudied(live.lastStudied)}</span></span>
              </div>
            </div>
            <span className={'rounded-md border px-2.5 py-1 text-xs font-medium ' + getStatusColor(live.status)}>{live.status}</span>
          </div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{live.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: live.progress + '%' }} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /><span>{live.deadline}</span>
          </div>
        </div>

        {/* Study Timer */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">Study Timer</h2>
          <div className="flex flex-col items-center gap-5">
            <div className={'flex h-40 w-40 items-center justify-center rounded-full border-4 transition-colors ' + (running ? 'border-accent' : 'border-border')}>
              <span className="font-mono text-3xl font-semibold tabular-nums">{formatTimer(secs)}</span>
            </div>
            <div className="flex items-center gap-3">
              {!running ? (
                <button onClick={() => { setSaved(false); setTimerError(''); setRunning(true); }}
                  className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 hover:shadow-lg">
                  <Play className="h-4 w-4" />{secs > 0 ? 'Resume' : 'Start'}
                </button>
              ) : (
                <button onClick={handleStop}
                  className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-6 py-2.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-500/20 dark:text-rose-400">
                  <Square className="h-4 w-4" />Stop
                </button>
              )}
              {secs > 0 && !running && (
                <button onClick={() => { setSecs(0); setSaved(false); setTimerError(''); }}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                  Reset
                </button>
              )}
            </div>
            {saved && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />Session recorded — last studied updated to today
              </div>
            )}
            {timerError && (
              <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-600 dark:text-rose-400">{timerError}</p>
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Mark Attendance</h2>
          {totalAttend > 0 && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Attendance rate</span>
                <span className="font-semibold">{attendPct}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: attendPct + '%' }} />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">✓ {attendedCount} attended</span>
                <span className="text-rose-600 dark:text-rose-400">✗ {missedCount} missed</span>
              </div>
            </div>
          )}
          <input type="text" value={attendNote} onChange={(e) => setAttendNote(e.target.value)}
            placeholder="Optional note (e.g. 'Topic: Sorting Algorithms')"
            className="mb-3 w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleAttend('attended')} disabled={attendSaving}
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400">
              {attendSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}Attended
            </button>
            <button onClick={() => handleAttend('missed')} disabled={attendSaving}
              className="flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-400">
              {attendSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}Missed
            </button>
          </div>
          {attendError && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{attendError}</p>}

          {live.attendance.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Recent</p>
              {[...live.attendance].reverse().slice(0, 5).map((a) => (
                <div key={a.id} className={'flex items-center justify-between rounded-lg border px-3 py-2 text-xs ' + (a.status === 'attended' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5')}>
                  <div className="flex items-center gap-2">
                    <span className={a.status === 'attended' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {a.status === 'attended' ? '✓ Attended' : '✗ Missed'}
                    </span>
                    {a.note && <span className="text-muted-foreground">— {a.note}</span>}
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Resources</h2>
            </div>
            <button onClick={() => setShowAddLink((p) => !p)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
              <Plus className="h-3.5 w-3.5" />Add link
            </button>
          </div>

          {showAddLink && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex gap-2 mb-2">
                <input type="text" value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="Label (e.g. Lecture Notes)"
                  className="w-2/5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                <input type="url" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              {linkError && <p className="mb-2 text-xs text-rose-600 dark:text-rose-400">{linkError}</p>}
              <div className="flex gap-2">
                <button onClick={handleAddResource} disabled={linkSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50">
                  {linkSaving && <Loader2 className="h-3 w-3 animate-spin" />}Save
                </button>
                <button onClick={() => { setShowAddLink(false); setNewLink({ label: '', url: '' }); setLinkError(''); }}
                  className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-muted">Cancel</button>
              </div>
            </div>
          )}

          {live.links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources yet. Click "Add link" above.</p>
          ) : (
            <div className="space-y-2">
              {live.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                  <a href={ensureProtocol(link.url)} target="_blank" rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-between transition-opacity hover:opacity-80">
                    <span className="font-medium">{link.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                  <button onClick={() => handleRemoveResource(link.id)}
                    className="ml-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-rose-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Reminder Modal ────────────────────────────────────────────────────────

interface AddReminderModalProps {
  courses: Course[];
  onAdd: (r: Reminder) => Promise<void>;
  onClose: () => void;
}

function AddReminderModal({ courses, onAdd, onClose }: AddReminderModalProps) {
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<Reminder['type']>('custom');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (!desc || !date) { setError('Description and date are required.'); return; }
    const dueISO = time ? new Date(date + 'T' + time).toISOString() : new Date(date).toISOString();
    const found = courses.find((c) => c.id === courseId);
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      type,
      courseId: courseId || undefined,
      courseName: found?.name,
      description: desc,
      dueDate: dueISO,
      daysUntil: Math.round((new Date(dueISO).getTime() - Date.now()) / 86400000),
      missed: new Date(dueISO) < new Date(),
    };
    setSaving(true);
    setError('');
    try {
      await onAdd(reminder);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save reminder.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Reminder</h2>
          <button onClick={onClose} className="rounded-lg p-1 transition-colors hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Math test this week"
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as Reminder['type'])}
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none">
              <option value="custom">Custom</option>
              <option value="test">Test</option>
              <option value="assignment">Assignment</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none">
              <option value="">— No course —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Time (optional)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none" />
            </div>
          </div>
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50">Cancel</button>
          <button onClick={handle} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Add Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Course Modal ──────────────────────────────────────────────────────────

interface AddCourseModalProps {
  onAdd: (c: Course) => Promise<void>;
  onClose: () => void;
}

function AddCourseModal({ onAdd, onClose }: AddCourseModalProps) {
  const [name, setName] = useState('');
  const [links, setLinks] = useState([{ label: '', url: '' }]);
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  const removeLink = (i: number) => setLinks(links.filter((_, j) => j !== i));
  const setLink = (i: number, f: 'label' | 'url', v: string) =>
    setLinks(links.map((l, j) => j === i ? { ...l, [f]: v } : l));

  const handle = async () => {
    if (!name.trim()) { setError('Course name is required.'); return; }
    const course: Course = {
      id: crypto.randomUUID(),
      name: name.trim(),
      progress,
      deadline: deadline || 'No deadline set',
      status: 'On Track',
      links: links.filter((l) => l.label && l.url).map((l) => ({
        id: crypto.randomUUID(), label: l.label, url: ensureProtocol(l.url),
      })),
      attendance: [],
      studySessions: [],
      createdAt: new Date().toISOString(),
    };
    setSaving(true);
    setError('');
    try {
      await onAdd(course);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save course.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Course</h2>
          <button onClick={onClose} className="rounded-lg p-1 transition-colors hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Course Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="e.g., DSA in Java" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Resource Links</label>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={link.label} onChange={(e) => setLink(i, 'label', e.target.value)}
                    className="w-2/5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    placeholder="Label" />
                  <input type="url" value={link.url} onChange={(e) => setLink(i, 'url', e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    placeholder="https://..." />
                  {links.length > 1 && (
                    <button onClick={() => removeLink(i)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addLink}
              className="mt-2 flex items-center gap-1.5 text-xs text-accent transition-opacity hover:opacity-80">
              <Plus className="h-3.5 w-3.5" />Add another link
            </button>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Next Deadline</label>
            <input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="e.g., Assignment due Mar 25" />
          </div>
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium">
              <span>Progress</span><span className="text-accent">{progress}%</span>
            </label>
            <input type="range" min="0" max="100" value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent" />
          </div>
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50">Cancel</button>
          <button onClick={handle} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Add Course
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Timeline ───────────────────────────────────────────────────────────

const weeklyTimeline = [
  { day: 'Mon', date: '17', events: [{ type: 'study', title: 'DSA Study', time: '2pm' }] },
  { day: 'Tue', date: '18', events: [{ type: 'deadline', title: 'DSA Assignment', time: '11:59pm' }] },
  { day: 'Wed', date: '19', events: [{ type: 'test', title: 'Math Quiz', time: '10am' }] },
  { day: 'Thu', date: '20', events: [{ type: 'study', title: 'ML Study', time: '3pm' }] },
  { day: 'Fri', date: '21', events: [] },
  { day: 'Sat', date: '22', events: [{ type: 'study', title: 'Web Dev', time: '1pm' }] },
  { day: 'Sun', date: '23', events: [] },
];

// ─── Main CourseHub ────────────────────────────────────────────────────────────

export function CourseHub() {
  const { courses, reminders, loading, addCourse, addReminder } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);

  // Keep selectedCourse in sync with context updates
  useEffect(() => {
    if (selectedCourse) {
      const updated = courses.find((c) => c.id === selectedCourse.id);
      if (updated) setSelectedCourse(updated);
    }
  }, [courses]);

  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Course Hub</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your courses and track your learning progress</p>
          </div>
          <button onClick={() => setShowAddCourse(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:opacity-90 hover:shadow-lg">
            <Plus className="h-4 w-4" />Add Course
          </button>
        </div>

        {/* Impact Note */}
        <div className="mb-8 rounded-xl border border-border bg-card/50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <div className="text-sm text-muted-foreground">
              Course activity impacts your <span className="font-medium text-foreground">Academic Health Score</span>. Missing deadlines reduces your score, while completing tasks on time improves it.
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Courses Grid */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Connected Courses</h2>
                <span className="text-sm text-muted-foreground">{courses.length} courses</span>
              </div>

              {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                  <p className="text-muted-foreground">No courses yet.</p>
                  <button onClick={() => setShowAddCourse(true)}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
                    <Plus className="h-4 w-4" />Add your first course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {courses.map((course) => (
                    <button key={course.id} onClick={() => setSelectedCourse(course)}
                      className="group rounded-xl border border-border bg-card p-5 shadow-sm text-left transition-all hover:shadow-md hover:border-accent/50 cursor-pointer">
                      <div className="mb-4">
                        <h3 className="font-semibold text-foreground">{course.name}</h3>
                        <span className={'mt-1.5 inline-block rounded-md border px-2 py-0.5 text-xs font-medium ' + getStatusColor(course.status)}>
                          {course.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{course.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: course.progress + '%' }} />
                        </div>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /><span>{course.deadline}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Most recently studied: <span className={'font-medium ' + (course.lastStudied ? 'text-foreground' : 'italic')}>{formatLastStudied(course.lastStudied)}</span></span>
                      </div>
                      {course.attendance.length > 0 && (() => {
                        const att = course.attendance.filter((a) => a.status === 'attended').length;
                        const tot = course.attendance.length;
                        return (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Attendance: <span className="font-medium text-foreground">{Math.round(att / tot * 100)}%</span> ({att}/{tot})</span>
                          </div>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar — Smart Reminders */}
            <div>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    <h3 className="font-semibold">Smart Reminders</h3>
                  </div>
                  <button onClick={() => setShowAddReminder(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                    <Bell className="h-3.5 w-3.5" />Add
                  </button>
                </div>
                <div className="space-y-3">
                  {reminders.length === 0 && <p className="text-sm text-muted-foreground">No reminders yet.</p>}
                  {reminders.map((r) => {
                    const isMissed = r.missed || new Date(r.dueDate) < new Date();
                    return (
                      <div key={r.id} className={'rounded-lg border p-3 ' + (isMissed ? 'border-rose-500/20 bg-rose-500/5' : 'border-border bg-muted/30')}>
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{r.description}</div>
                            {r.courseName && <div className="mt-0.5 text-xs text-muted-foreground">{r.courseName}</div>}
                          </div>
                          {isMissed
                            ? <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
                            : <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                        </div>
                        <div className="mt-1.5 text-xs text-muted-foreground">{formatReminderDate(r.dueDate)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Timeline */}
        {!loading && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <h3 className="font-semibold">Weekly Timeline</h3>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {weeklyTimeline.map((day) => (
                <div key={day.day} className="rounded-lg border border-border bg-muted/20 p-3 transition-all hover:border-accent/50">
                  <div className="mb-2 text-center">
                    <div className="text-xs text-muted-foreground">{day.day}</div>
                    <div className="mt-1 text-lg font-semibold">{day.date}</div>
                  </div>
                  <div className="space-y-2">
                    {day.events.map((e, i) => (
                      <div key={i} className={'rounded-md p-2 text-xs ' + (e.type === 'test' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : e.type === 'deadline' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-accent/10 text-accent-foreground')}>
                        <div className="font-medium">{e.title}</div>
                        <div className="mt-0.5 text-[10px] opacity-75">{e.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddCourse && (
        <AddCourseModal onAdd={addCourse} onClose={() => setShowAddCourse(false)} />
      )}
      {showAddReminder && (
        <AddReminderModal courses={courses} onAdd={addReminder} onClose={() => setShowAddReminder(false)} />
      )}
    </div>
  );
}
