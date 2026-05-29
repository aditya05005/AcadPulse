import type { CourseTopic } from './types';

export function calculateCourseProgress(topics: CourseTopic[]): number {
  if (topics.length === 0) return 0;
  const completed = topics.filter((topic) => topic.isCompleted).length;
  return Math.round((completed / topics.length) * 100);
}

