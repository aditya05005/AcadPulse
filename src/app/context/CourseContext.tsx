import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { Course, Reminder, ResourceLink, AttendanceRecord, StudySession, CourseTopic } from '../../lib/types';
import {
  getCourses, getReminders,
  upsertCourse, deleteCourse as dbDeleteCourse,
  insertResource, deleteResource as dbDeleteResource,
  insertAttendance,
  insertStudySession, updateLastStudied as dbUpdateLastStudied,
  upsertReminder, deleteReminder as dbDeleteReminder,
  insertCourseTopic, updateCourseTopic as dbUpdateCourseTopic,
  deleteCourseTopic as dbDeleteCourseTopic, updateCourseProgress,
} from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { calculateCourseProgress } from '../../lib/courseProgress';

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
  addTopic: (courseId: string, title: string) => Promise<void>;
  addTopicsBulk: (courseId: string, titles: string[]) => Promise<void>;
  updateTopic: (courseId: string, topic: CourseTopic) => Promise<void>;
  removeTopic: (courseId: string, topicId: string) => Promise<void>;
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

  const syncCourseProgress = async (courseId: string, topics: CourseTopic[]) => {
    const progress = calculateCourseProgress(topics);
    await updateCourseProgress(courseId, progress);
    return progress;
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
    setReminders((prev) => {
      const exists = prev.some((r) => r.id === reminder.id);
      return exists ? prev.map((r) => (r.id === reminder.id ? reminder : r)) : [...prev, reminder];
    });
  };

  const removeReminder = async (id: string) => {
    await dbDeleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Topics ────────────────────────────────────────────────────────────────

  const addTopic = async (courseId: string, title: string) => {
    const topic: CourseTopic = {
      id: crypto.randomUUID(),
      courseId,
      title: title.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    await insertCourseTopic(courseId, topic);
    const current = courses.find((course) => course.id === courseId);
    const nextTopics = [...(current?.topics ?? []), topic];
    const progress = await syncCourseProgress(courseId, nextTopics);
    setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, topics: nextTopics, progress } : course)));
  };

  const addTopicsBulk = async (courseId: string, titles: string[]) => {
    const uniqueTitles = [...new Set(titles.map((title) => title.trim()).filter(Boolean))];
    if (uniqueTitles.length === 0) return;

    const newTopics: CourseTopic[] = uniqueTitles.map((title) => ({
      id: crypto.randomUUID(),
      courseId,
      title,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }));

    await Promise.all(newTopics.map((topic) => insertCourseTopic(courseId, topic)));
    const current = courses.find((course) => course.id === courseId);
    const nextTopics = [...(current?.topics ?? []), ...newTopics];
    const progress = await syncCourseProgress(courseId, nextTopics);
    setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, topics: nextTopics, progress } : course)));
  };

  const updateTopic = async (courseId: string, topic: CourseTopic) => {
    await dbUpdateCourseTopic(topic);
    const current = courses.find((course) => course.id === courseId);
    const nextTopics = (current?.topics ?? []).map((item) => (item.id === topic.id ? topic : item));
    const progress = await syncCourseProgress(courseId, nextTopics);
    setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, topics: nextTopics, progress } : course)));
  };

  const removeTopic = async (courseId: string, topicId: string) => {
    await dbDeleteCourseTopic(topicId);
    const current = courses.find((course) => course.id === courseId);
    const nextTopics = (current?.topics ?? []).filter((topic) => topic.id !== topicId);
    const progress = await syncCourseProgress(courseId, nextTopics);
    setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, topics: nextTopics, progress } : course)));
  };

  return (
    <CourseContext.Provider value={{
      courses, reminders, loading,
      addCourse, updateCourse, removeCourse,
      addResource, removeResource,
      updateLastStudied, markAttendance,
      addReminder, removeReminder,
      addTopic, addTopicsBulk, updateTopic, removeTopic,
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
