import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { Course, Reminder, ResourceLink, AttendanceRecord, StudySession } from '../../lib/types';
import {
  getCourses, getReminders,
  upsertCourse, deleteCourse as dbDeleteCourse,
  insertResource, deleteResource as dbDeleteResource,
  insertAttendance,
  insertStudySession, updateLastStudied as dbUpdateLastStudied,
  upsertReminder, deleteReminder as dbDeleteReminder,
} from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';

interface CourseContextType {
  courses: Course[];
  reminders: Reminder[];
  loading: boolean;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  removeCourse: (id: string) => Promise<void>;
  addResource: (courseId: string, link: ResourceLink) => Promise<void>;
  removeResource: (courseId: string, linkId: string) => Promise<void>;
  updateLastStudied: (courseId: string, date: string, session: StudySession) => Promise<void>;
  markAttendance: (courseId: string, record: AttendanceRecord) => Promise<void>;
  addReminder: (reminder: Reminder) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Single source of truth for user availability
  const [courses, setCourses] = useState<Course[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadingRef = useRef(false);
  const fetchedUserTrackRef = useRef<string | null>(null);

  const loadData = async (force = false) => {
    if (loadingRef.current) return; // Prevent overlapping queries
    
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      setCourses([]);
      setReminders([]);
      fetchedUserTrackRef.current = null;
      setLoading(false);
      return;
    }

    // Skip redundant network queries if data is already live for this user
    if (!force && fetchedUserTrackRef.current === currentUserId) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    
    try {
      const [c, r] = await Promise.all([getCourses(), getReminders()]);
      setCourses(c);
      setReminders(r);
      fetchedUserTrackRef.current = currentUserId;
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
      setCourses([]);
      setReminders([]);
      fetchedUserTrackRef.current = null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // React strictly to Auth state updates to ensure safe context coordination
  useEffect(() => {
    if (user) {
      loadData(true); // Force data populate on successful user detection
    } else {
      setCourses([]);
      setReminders([]);
      fetchedUserTrackRef.current = null;
      setLoading(false);
    }
  }, [user]);

  // Handle explicit cleanups on global system events
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          setCourses([]);
          setReminders([]);
          fetchedUserTrackRef.current = null;
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Courses ────────────────────────────────────────────────────────────────

  const addCourse = async (course: Course) => {
    await upsertCourse(course);
    if (course.links.length > 0) {
      await Promise.all(course.links.map((link) => insertResource(course.id, link)));
    }
    setCourses((prev) => [...prev, course]);
  };

  const updateCourse = async (course: Course) => {
    await upsertCourse(course);
    setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c)));
  };

  const removeCourse = async (id: string) => {
    await dbDeleteCourse(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.courseId === id
          ? { ...reminder, courseId: undefined, courseName: undefined }
          : reminder
      )
    );
  };

  // ── Resources ──────────────────────────────────────────────────────────────

  const addResource = async (courseId: string, link: ResourceLink) => {
    await insertResource(courseId, link);
    setCourses((prev) =>
      prev.map((c) => c.id === courseId ? { ...c, links: [...c.links, link] } : c)
    );
  };

  const removeResource = async (courseId: string, linkId: string) => {
    await dbDeleteResource(linkId);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
      )
    );
  };

  // ── Study sessions ─────────────────────────────────────────────────────────

  const updateLastStudied = async (courseId: string, date: string, session: StudySession) => {
    await Promise.all([
      dbUpdateLastStudied(courseId, date),
      insertStudySession(courseId, session),
    ]);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, lastStudied: date, studySessions: [...c.studySessions, session] }
          : c
      )
    );
  };

  // ── Attendance ─────────────────────────────────────────────────────────────

  const markAttendance = async (courseId: string, record: AttendanceRecord) => {
    await insertAttendance(courseId, record);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, attendance: [...c.attendance, record] } : c
      )
    );
  };

  // ── Reminders ──────────────────────────────────────────────────────────────

  const addReminder = async (reminder: Reminder) => {
    await upsertReminder(reminder);
    setReminders((prev) => [...prev, reminder]);
  };

  const removeReminder = async (id: string) => {
    await dbDeleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <CourseContext.Provider value={{
      courses, reminders, loading,
      addCourse, updateCourse, removeCourse,
      addResource, removeResource,
      updateLastStudied, markAttendance,
      addReminder, removeReminder,
      reload: () => loadData(true),
    }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourses must be used within CourseProvider');
  return ctx;
}
