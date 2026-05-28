import type { Course } from './types';

export function deriveCourseStatus(lastStudied?: string, createdAt?: string): Course['status'] {
  const source = lastStudied ?? createdAt;
  if (!source) return 'Cold';

  const diffDays = Math.floor((Date.now() - new Date(source).getTime()) / 86400000);
  if (diffDays <= 3) return 'Active';
  if (diffDays <= 10) return 'Steady';
  return 'Cold';
}

