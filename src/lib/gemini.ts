const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-1.5-flash';

const SYLLABUS_PROMPT = `Analyze this academic course syllabus PDF.

Your task is to generate a study checklist for a student.
Do NOT extract the top-level main Module/Chapter titles (they are too broad).
Do NOT extract individual tiny keywords or algorithms (they are too narrow).

Instead, extract the mid-level operational sub-topics or conceptual units (usually numbered like 1.1, 1.2, 2.1, or listed as immediate sub-headings). Each item should represent roughly 1 to 2 lectures or a single solid study session.

Clean up the text to look like clean, actionable study goals.
Example translation based on expected layout:
- Instead of "Module 2: Search and Game Playing"
- Extract: "Uninformed Search Techniques", "Informed Search & Heuristics", "Adversarial Search & Game Playing"

Respond strictly in this JSON format:
{
  "topics": [
    "Introduction to AI & Intelligent Agents",
    "Problem-Solving Frameworks",
    "Uninformed Search Techniques",
    "Informed Search & Heuristics",
    "Adversarial Search & Game Playing",
    "Propositional Logic & Inference",
    "First-Order Logic & Rule-Based Systems",
    "Probability Basics & Bayes' Theorem",
    "Bayesian Networks & Managing Uncertainty",
    "Introduction to Machine Learning Types",
    "Supervised Learning (Regression & Classification)",
    "Unsupervised Learning (Clustering & K-Means)",
    "AI Applications & Future Trends",
    "AI Ethics, Bias & Societal Impact"
  ]
}`;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export async function extractTopicsFromSyllabus(file: File): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key.');
  }

  if (!file.type.startsWith('application/pdf') && !file.type.startsWith('image/')) {
    throw new Error('Unsupported file type.');
  }

  const inlineData = await readFileAsBase64(file);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: SYLLABUS_PROMPT },
              { inlineData: { mimeType: file.type, data: inlineData } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || 'Gemini request failed.');
  }

  const data = await response.json();
  const responseText = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  if (!responseText) {
    throw new Error('Empty Gemini response.');
  }

  const parsed = JSON.parse(responseText) as { topics?: unknown };
  const topics = Array.isArray(parsed.topics)
    ? parsed.topics.map((topic) => String(topic).trim()).filter(Boolean)
    : [];

  if (!topics.length) {
    throw new Error('No topics returned.');
  }

  return topics;
}
