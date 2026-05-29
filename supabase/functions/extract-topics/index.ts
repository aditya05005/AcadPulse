const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash';

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

function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function extractTopics(payload: string): string[] {
  const trimmed = payload.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    : trimmed;
  const candidate = jsonText.includes('{') && jsonText.includes('}')
    ? jsonText.slice(jsonText.indexOf('{'), jsonText.lastIndexOf('}') + 1)
    : jsonText;
  const parsed = JSON.parse(candidate) as { topics?: unknown };
  if (!Array.isArray(parsed.topics)) return [];
  return parsed.topics.map((topic) => String(topic).trim()).filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  if (!GEMINI_API_KEY) {
    return jsonResponse({ error: 'Missing Gemini API key.' }, 500);
  }

  try {
    const formData = await req.formData();
    const maybeFile = formData.get('file');

    if (!(maybeFile instanceof File)) {
      return jsonResponse({ error: 'Missing file upload.' }, 400);
    }

    if (!maybeFile.type.startsWith('application/pdf') && !maybeFile.type.startsWith('image/')) {
      return jsonResponse({ error: 'Unsupported file type.' }, 400);
    }

    const inlineData = await fileToBase64(maybeFile);
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
                { inlineData: { mimeType: maybeFile.type, data: inlineData } },
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
      return jsonResponse({ error: body || 'Gemini request failed.' }, 502);
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim();

    if (!responseText) {
      return jsonResponse({ error: 'Empty Gemini response.' }, 502);
    }

    let topics: string[] = [];
    try {
      topics = extractTopics(responseText);
    } catch {
      return jsonResponse({ error: 'Invalid Gemini JSON.' }, 502);
    }

    if (!topics.length) {
      return jsonResponse({ error: 'No topics returned.' }, 422);
    }

    return jsonResponse({ topics });
  } catch (error) {
    console.error('extract-topics failed:', error);
    return jsonResponse({ error: 'Failed to extract topics.' }, 500);
  }
});
