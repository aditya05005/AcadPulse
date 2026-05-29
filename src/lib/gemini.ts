import { supabase } from './supabase';

type ExtractTopicsResponse = {
  topics: string[];
};

export async function extractTopicsFromSyllabus(file: File): Promise<string[]> {
  if (!file.type.startsWith('application/pdf') && !file.type.startsWith('image/')) {
    throw new Error('Unsupported file type.');
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  const { data, error } = await supabase.functions.invoke<ExtractTopicsResponse>('extract-topics', {
    body: formData,
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to extract topics.');
  }

  if (!data?.topics?.length) {
    throw new Error('No topics returned.');
  }

  return data.topics.map((topic) => String(topic).trim()).filter(Boolean);
}
