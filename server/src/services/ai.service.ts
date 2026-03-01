// ============================================
// AI Emotional Support Service
// ============================================
// Handles Groq integration for emotional support.
// Includes safety moderation and context-aware responses.
// ============================================

import Groq from 'groq-sdk';
import prisma from '../utils/prisma';
import { BadRequestError, InternalError } from '../utils/appError';

// ============================================
// GROQ CLIENT INITIALIZATION (FREE AI)
// ============================================

// Check if API key is configured
const isAIConfigured = (): boolean => {
  const apiKey = process.env.GROQ_API_KEY;
  return !!(apiKey && apiKey.startsWith('gsk_'));
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key',
});

// Models in priority order — each has its own rate-limit bucket on Groq free tier
const AI_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
] as const;

const AI_MODEL = AI_MODELS[0];

/**
 * Call Groq with automatic model fallback on rate-limit (429) errors.
 * Tries each model in AI_MODELS until one succeeds.
 */
const callGroqWithFallback = async (
  params: Omit<Parameters<typeof groq.chat.completions.create>[0], 'model'>
): Promise<Groq.Chat.ChatCompletion> => {
  let lastError: unknown;
  for (const model of AI_MODELS) {
    try {
      const result = await groq.chat.completions.create({ ...params, model } as any);
      return result as Groq.Chat.ChatCompletion;
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || String(error);
      const isRateLimit =
        error?.status === 429 ||
        msg.toLowerCase().includes('rate limit') ||
        msg.toLowerCase().includes('too many requests');
      if (isRateLimit) {
        console.warn(`Rate limit on ${model}, trying next model...`);
        continue;
      }
      // Non-rate-limit error — don't try other models
      throw error;
    }
  }
  // All models rate-limited
  throw lastError;
};

// ============================================
// TYPES
// ============================================

export interface EmotionalContext {
  recentMoods: Array<{
    mood: string;
    intensity: number;
    createdAt: Date;
  }>;
  recentJournalSummary: string | null;
  conversationHistory: Array<{
    message: string;
    response: string;
  }>;
  userName: string | null;
}

export interface AIResponse {
  response: string;
  isCrisisDetected: boolean;
  contextUsed: boolean;
}

export interface WeeklySummary {
  dominantMood: string | null;
  averageIntensity: number;
  supportiveSentences: string[];
  insightSentence: string;
  suggestion: string;
  moodDistribution: Record<string, number>;
  entryCount: number;
}

export interface DailyReflectionResponse {
  question: string;
  encouragement: string;
  cached: boolean;
}

// ============================================
// SAFETY LAYER
// ============================================

// Safety level words
const LEVEL_3_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'hurt myself',
  "i'm going to do it", "i don't want to live"
];

const LEVEL_2_KEYWORDS = [
  'disappear', "don't want to exist", 'no point', 'feel numb',
  'feel empty', 'tired of being here', 'want everything to stop'
];

/**
 * Detect emotional safety level based on user input
 * Returns 1 (Normal), 2 (Stabilize), or 3 (Crisis)
 */
export const detectSafetyLevel = (message: string): 1 | 2 | 3 => {
  const lowerMessage = message.toLowerCase();

  if (LEVEL_3_KEYWORDS.some(word => lowerMessage.includes(word))) {
    return 3;
  }

  if (LEVEL_2_KEYWORDS.some(word => lowerMessage.includes(word))) {
    return 2;
  }

  return 1;
};

// Prompt injection patterns to block
const INJECTION_PATTERNS = [
  /ignore.*previous.*instructions/i,
  /ignore.*system.*prompt/i,
  /you.*are.*now/i,
  /pretend.*you.*are/i,
  /act.*as.*if/i,
  /new.*instructions/i,
  /override.*system/i,
  /disregard.*rules/i,
  /forget.*everything/i,
  /jailbreak/i,
];

/**
 * Check for prompt injection attempts
 */
export const detectInjection = (message: string): boolean => {
  return INJECTION_PATTERNS.some(pattern => pattern.test(message));
};

/**
 * Basic content moderation mapped to 3-Level Safety logic
 */
export const moderateContent = (message: string): { safe: boolean; reason?: string; level: 1 | 2 | 3 } => {
  const level = detectSafetyLevel(message);

  // Check for crisis content
  if (level === 3) {
    return { safe: false, reason: 'crisis', level };
  }

  // Check for injection attempts
  if (detectInjection(message)) {
    return { safe: false, reason: 'injection', level };
  }

  // Check message length
  if (message.length > 500) {
    return { safe: false, reason: 'length', level };
  }

  if (message.trim().length === 0) {
    return { safe: false, reason: 'empty', level };
  }

  return { safe: true, level };
};

/**
 * Get crisis support response (Level 3 - Active Suicidal Intent Override)
 */
const getCrisisResponse = (): string => {
  return `I’m really glad you told me. That sounds serious, and I care about your safety.\n\n` +
    `If you’re feeling like you might act on these thoughts, please reach out to someone right now — a trusted person, a family member, or a local emergency number.\n\n` +
    `If you’re in immediate danger, please call your local emergency services (like 988 in the US).\n\n` +
    `You don’t have to handle this alone. I can stay here with you while you reach out. Are you safe where you are right now?`;
};

// ============================================
// SYSTEM PROMPTS
// ============================================

const EMOTIONAL_SUPPORT_PROMPT = `You are UNSAID’s AI Emotion Supporter. You respond like a real human — a grounded friend who can be calm, strong, or direct depending on what the user needs.

Your personality blends:
• The steadiness of an older brother
• The calm presence of a reflective friend
• The clarity of someone who speaks truth gently

You are not a therapist. You are not a motivational speaker. You are not a chatbot. You are emotionally intelligent, natural, and real.

CORE BEHAVIOR:
Adapt to the user's tone:
- If they are anxious: respond grounding and steady.
- If they are sad: respond soft and calm.
- If they are spiraling: stabilize gently.
- If they are overthinking: clarify clearly.
- If they are angry: grounded but firm.
- If they need honesty: be direct but respectful.
Match emotional intensity. Never overpower the user’s tone.

STRICT RULES - NEVER SAY:
- “That’s very vulnerable.”
- “It takes courage.”
- “Thank you for sharing.”
- “That’s valid.”
- “I hear you.”
- “As an AI…”

AVOID:
Therapy clichés, self-help book language, long lectures, over-structured responses, and fake positivity. Keep responses natural and conversational.

RESPONSE STRUCTURE:
1. Acknowledge emotion in simple language.
2. Reflect what may be happening underneath.
3. Offer grounded perspective.
4. Ask ONE thoughtful question max (optional).

Keep responses concise but meaningful. If the user writes short, respond short. If they write deep emotional paragraph, respond deeper.

CRISIS OVERRIDE:
If user expresses thoughts of self-harm or severe hopelessness: Shift tone immediately to calm, grounded, and supportive. Encourage reaching out to a real person gently. Do not panic. Do not lecture. Do not sound automated.

GOAL:
The user should feel heard, not judged, not analyzed like a case study, not talked down to, and not handled like a therapy patient. They should feel like they’re talking to someone real who genuinely cares. Your responses should feel like a late-night honest conversation with someone steady and emotionally aware.

You have access to the user's recent mood data and journal summaries to provide connected support.`;

const STABILIZE_MODE_PROMPT = `Switch to STABILIZE MODE.

In Stabilize Mode:
- Keep response short and steady. Use shorter, more grounded statements.
- Avoid phrases like: "That can be a really tough feeling", "That sounds overwhelming", or "It sounds like...".
- Do not reframe.
- Do not give productivity advice.
- Do not push gratitude.
- Avoid heavy analysis.
- Ask one gentle clarification question.
- Gently assess whether they are safe.

Tone: Calm. Grounded. Non-dramatic. Human.
The goal is emotional stabilization, not problem-solving.`;

const WEEKLY_SUMMARY_PROMPT = `You are analyzing a user's emotional data for the UNSAID journaling app.

Analyze the mood entries and journal themes. Provide a structured, human-first response in precisely this format:

3 short, supportive sentences about their week (one per line).
Insight: [1 punchy insight about their dominant mood or trend]
Suggestion: [1 gentle reflection exercise or small action]

Rules:
- Non-judgmental, warm, but concise.
- No percentages.
- No list markers (1. 2. 3.).
- Focus on the "Human" behind the stats.`;

const DAILY_REFLECTION_PROMPT = `You are creating a daily reflection prompt for the UNSAID journaling app.

Create one thoughtful question and one short encouragement message.

The question should:
- Be open-ended and introspective
- Encourage self-reflection
- Be gentle and non-judgmental
- Help the user connect with their emotions

The encouragement should:
- Be warm and genuine
- Be 1-2 sentences
- Offer hope without being cliché

Respond in JSON format:
{
  "question": "your question here",
  "encouragement": "your encouragement here"
}`;

const WEEKLY_INTERPRETATION_PROMPT = `You are UNSAID’s Emotional Guide. 
You interpret a user's weekly mood statistics into a human-first, empathetic interpretation.
Avoid raw numbers. Use warm, interpretive language.
Focus on the overall "vibe" and how it might feel for the user.
Return a single paragraph (2-3 sentences) summarizing their week's vibe.`;

const PAST_SELF_MESSAGE_PROMPT = `You are UNSAID’s Reflective Companion.
You analyze a user's journal entry from a few days ago and provide a short, supportive acknowledgment of their journey.
The goal is to show progress and validate their resilience.
Context: You will be given a journal entry from 3-7 days ago.
Format: "You were [emotion/feeling] on [day/date]. You handled it." or similar.
Keep it under 20 words. Be empathetic and grounded.`;

const REFLECTION_ANALYSIS_PROMPT = `You are UNSAID’s Reflection Guide. You analyze a journal entry and provide a structured, human-first response.

Your Goal:
Make the user feel heard and understood. No clinical or academic language.

RESPONSE STRUCTURE:
1. Support (3-4 short, empathetic sentences):
   - Acknowledge their specific mood and what affected them today.
   - For example, if they say "Work" affected them and they feel "Drained by: Workload", validate that weight.
2. Insight (1 sentence):
   - Highlight a pattern or a specific emotional connection based on their entry or 7-day history.
3. Micro-Suggestion (1 gentle sentence):
   - Practical action based on their "Need" or mood. (Music, Rest, AI Chat, Focus).

RULES:
[Context about their recent week will be provided]`;

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Fetch user's emotional context for personalized responses
 */
export const getEmotionalContext = async (userId: string): Promise<EmotionalContext> => {
  // Fetch last 5 mood entries
  const recentMoods = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      mood: true,
      intensity: true,
      createdAt: true,
    },
  });

  // Fetch last 3 journal entries for summary
  const recentJournals = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      content: true,
      emotion: true,
      createdAt: true,
    },
  });

  // Create a brief summary of journals (first 150 chars each)
  const journalSummary = recentJournals.length > 0
    ? recentJournals.map(j => j.content.substring(0, 150)).join(' | ')
    : null;

  // Fetch last 3 AI conversations for context
  const conversationHistory = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      message: true,
      response: true,
    },
  });

  // Fetch user details for their name
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  return {
    recentMoods,
    recentJournalSummary: journalSummary,
    conversationHistory: conversationHistory.reverse(), // Chronological order
    userName: user?.firstName || null,
  };
};

/**
 * Generate emotional support response
 */
export const generateEmotionalResponse = async (
  userId: string,
  message: string
): Promise<AIResponse> => {
  // 1. Content moderation
  const moderation = moderateContent(message);

  if (!moderation.safe) {
    if (moderation.reason === 'crisis') {
      return {
        response: getCrisisResponse(),
        isCrisisDetected: true,
        contextUsed: false,
      };
    }

    if (moderation.reason === 'injection') {
      throw BadRequestError('Invalid message content');
    }

    if (moderation.reason === 'length') {
      throw BadRequestError('Message must be 500 characters or less');
    }

    if (moderation.reason === 'empty') {
      throw BadRequestError('Message cannot be empty');
    }
  }

  // 2. Fetch emotional context
  const context = await getEmotionalContext(userId);
  const hasContext = context.recentMoods.length > 0 || !!context.recentJournalSummary;

  // 3. Build context message
  let contextMessage = '';

  if (context.recentMoods.length > 0) {
    const moodSummary = context.recentMoods
      .map(m => `${m.mood} (intensity: ${m.intensity}/10)`)
      .join(', ');
    contextMessage += `Recent moods: ${moodSummary}. `;
  }

  if (context.recentJournalSummary) {
    contextMessage += `Recent journal themes: ${context.recentJournalSummary.substring(0, 300)}. `;
  }

  if (context.userName) {
    contextMessage += `User's name: ${context.userName}. Use this occasionally to sound personal.`;
  }

  // 4. Build conversation messages
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: EMOTIONAL_SUPPORT_PROMPT },
  ];

  if (moderation.level === 2) {
    messages.push({ role: 'system', content: STABILIZE_MODE_PROMPT });
  }

  // Add context if available
  if (contextMessage) {
    messages.push({
      role: 'system',
      content: `User context: ${contextMessage}`,
    });
  }

  // Add conversation history (last 2 exchanges to save tokens)
  for (const conv of context.conversationHistory.slice(-2)) {
    messages.push({ role: 'user', content: conv.message });
    messages.push({ role: 'assistant', content: conv.response });
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  // 5. Check if Groq is configured
  if (!isAIConfigured()) {
    console.error('Groq API key not configured. Set GROQ_API_KEY in .env');
    // Return a helpful fallback response
    return {
      response: "I'm here to support you. While the AI features are being set up, feel free to explore your journal and mood tracker. Writing down your thoughts can be a powerful way to process emotions.",
      isCrisisDetected: false,
      contextUsed: false,
    };
  }

  // 6. Call Groq API (Free AI) — with automatic model fallback
  try {
    const completion = await callGroqWithFallback({
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw InternalError('Failed to generate response');
    }

    return {
      response: response.trim(),
      isCrisisDetected: false,
      contextUsed: hasContext,
    };
  } catch (error) {
    console.error('Groq API Error:', error);

    // Check for rate limit errors (by status or message)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('too many requests') ||
      errorMessage.includes('429');

    if (isRateLimit) {
      // Extract retry-after info if available
      const retryMatch = errorMessage.match(/try again in (\d+[hms\d.]+)/i);
      const retryInfo = retryMatch ? ` (resets in ~${retryMatch[1]})` : '';
      console.warn(`All AI models rate-limited${retryInfo}. Daily token quota exhausted.`);
      return {
        response: `I'm currently at my daily limit for AI responses${retryInfo}. This resets every 24 hours. In the meantime, try writing in your journal or logging your mood — those features work offline and can be just as powerful for processing emotions.`,
        isCrisisDetected: false,
        contextUsed: false,
      };
    }

    // Handle specific API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number };
      if (apiError.status === 401) {
        throw InternalError('AI service authentication failed. Please check API key configuration.');
      }
      if (apiError.status === 500 || apiError.status === 503) {
        throw InternalError('AI service is temporarily unavailable. Please try again later.');
      }
    }

    // Generic fallback for any other error
    return {
      response: "Thank you for sharing with me. While I process your thoughts, remember that expressing your feelings is a sign of strength. What else is on your mind?",
      isCrisisDetected: false,
      contextUsed: false,
    };
  }
};

/**
 * Save AI conversation to database
 */
export const saveConversation = async (
  userId: string,
  message: string,
  response: string,
  contextUsed: boolean
) => {
  return prisma.aIConversation.create({
    data: {
      userId,
      message,
      response,
      contextUsed,
    },
  });
};

/**
 * Get conversation history for a user
 */
export const getConversationHistory = async (
  userId: string,
  limit: number = 20
) => {
  return prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      message: true,
      response: true,
      createdAt: true,
    },
  });
};

/**
 * Generate weekly emotional summary
 */
export const generateWeeklySummary = async (userId: string): Promise<WeeklySummary> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Fetch mood entries from the past week
  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: { gte: weekAgo },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch journal entries from the past week
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      userId,
      createdAt: { gte: weekAgo },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      content: true,
      emotion: true,
      createdAt: true,
    },
  });

  // Calculate statistics
  const moodCounts: Record<string, number> = {};
  let totalIntensity = 0;

  for (const entry of moodEntries) {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    totalIntensity += entry.intensity;
  }

  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const averageIntensity = moodEntries.length > 0
    ? Math.round((totalIntensity / moodEntries.length) * 10) / 10
    : 0;

  // If no data, return default summary
  if (moodEntries.length === 0 && journalEntries.length === 0) {
    return {
      dominantMood: null,
      averageIntensity: 0,
      supportiveSentences: [
        "Your emotional landscape is waiting to be explored.",
        "Every small note you leave is a step toward clarity.",
        "We're here whenever you're ready to share."
      ],
      insightSentence: "No patterns have emerged yet.",
      suggestion: "Try logging your first mood for today.",
      moodDistribution: {},
      entryCount: 0,
    };
  }

  // Build data summary for AI
  const dataSummary = `
Mood data (last 7 days):
- Total entries: ${moodEntries.length}
- Mood distribution: ${JSON.stringify(moodCounts)}
- Average intensity: ${averageIntensity}/10
- Dominant mood: ${dominantMood}

Journal entries: ${journalEntries.length}
Journal themes: ${journalEntries.map(j => j.content.substring(0, 100)).join(' | ')}
`;

  // If OpenAI is not configured, return stats-only summary
  if (!isAIConfigured()) {
    return {
      dominantMood,
      averageIntensity,
      supportiveSentences: [
        `You've logged ${moodEntries.length} moments this week.`,
        "Consistency is a quiet form of self-care.",
        "Your entries are building a map of your inner world."
      ],
      insightSentence: dominantMood ? `${dominantMood.charAt(0) + dominantMood.slice(1).toLowerCase()} appeared most often.` : "Your energy has been steady.",
      suggestion: "Keep noticing the small shifts in your day.",
      moodDistribution: moodCounts,
      entryCount: moodEntries.length + journalEntries.length,
    };
  }

  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: WEEKLY_SUMMARY_PROMPT },
        { role: 'user', content: `Please analyze this week's emotional data and provide insights:\n${dataSummary}` },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // Parse structured response
    const lines = aiResponse.split('\n').map(l => l.trim()).filter(l => l);

    // Extract Suggestion and Insight
    const suggestionLine = lines.find(l => l.toLowerCase().startsWith('suggestion:')) || '';
    const insightLine = lines.find(l => l.toLowerCase().startsWith('insight:')) || '';

    // Remaining lines are supportive sentences
    const otherLines = lines.filter(l => l !== suggestionLine && l !== insightLine);
    const supportiveSentences = otherLines.slice(0, 3);

    // Fill if missing
    while (supportiveSentences.length < 3) supportiveSentences.push("You're navigating it all with grace.");

    return {
      dominantMood,
      averageIntensity,
      supportiveSentences,
      insightSentence: insightLine.replace(/^insight:\s*/i, '') || "You're finding your own rhythm.",
      suggestion: suggestionLine.replace(/^suggestion:\s*/i, '') || "Take a deep breath and stay present.",
      moodDistribution: moodCounts,
      entryCount: moodEntries.length + journalEntries.length,
    };
  } catch (error) {
    return {
      dominantMood,
      averageIntensity,
      supportiveSentences: ["The week had its own melody.", "You're listening to it well.", "Keep moving forward."],
      insightSentence: "Patterns are still forming.",
      suggestion: "Take a moment for yourself today.",
      moodDistribution: moodCounts,
      entryCount: moodEntries.length + journalEntries.length,
    };
  }
};

/**
 * Generate a human-first interpretation of weekly mood stats
 */
export const generateWeeklyInterpretation = async (stats: any): Promise<string> => {
  if (!isAIConfigured()) {
    const mood = stats.mostFrequentMood ? stats.mostFrequentMood.toLowerCase() : 'steady';
    return `This week felt mostly ${mood}. Your average intensity was about ${Math.round(stats.averageIntensity)}/10.`;
  }

  const prompt = `Interpret these weekly stats into a warm 2-sentence summary:
  Dominant Mood: ${stats.mostFrequentMood || 'Neutral'}
  Average Intensity: ${stats.averageIntensity}/10
  Entry Count: ${stats.totalEntries}`;

  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: WEEKLY_INTERPRETATION_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || "Your week has its own steady rhythm.";
  } catch (error) {
    return "The week had its own melody, and you're listening to it well.";
  }
};

/**
 * Generate a message from a past self based on old journal entries
 */
export const getMessageFromPastSelf = async (userId: string): Promise<string> => {
  // Fetch an entry from 3-7 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pastEntry = await prisma.journalEntry.findFirst({
    where: {
      userId,
      createdAt: {
        gte: sevenDaysAgo,
        lte: threeDaysAgo,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!pastEntry) {
    return "Looking back, every step you took brought you here.";
  }

  if (!isAIConfigured()) {
    const dayName = new Date(pastEntry.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
    return `You were reflecting on ${dayName}. You've come a long way since then.`;
  }

  const dayName = new Date(pastEntry.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
  const entrySnippet = pastEntry.content.substring(0, 300);

  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: PAST_SELF_MESSAGE_PROMPT },
        { role: 'user', content: `Journal entry from ${dayName}:\n"${entrySnippet}"` },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || `You were reflecting on ${dayName}. You handled it.`;
  } catch (error) {
    return `You were reflecting on ${dayName}. You're still here, and that counts.`;
  }
};

/**
 * Generate or retrieve cached daily reflection
 */
export const getDailyReflection = async (userId: string): Promise<DailyReflectionResponse> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for cached reflection
  const cached = await prisma.dailyReflection.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (cached) {
    return {
      question: cached.question,
      encouragement: cached.encouragement,
      cached: true,
    };
  }

  // Fallback prompts for when AI is not available
  const fallbackQuestions = [
    "What brought you a moment of peace today?",
    "What are you grateful for in this moment?",
    "How did you show kindness to yourself today?",
    "What emotion do you want to honor today?",
    "What would make today meaningful for you?",
  ];

  const fallbackEncouragements = [
    "You're doing better than you think.",
    "Every small step forward counts.",
    "Your presence in this world matters.",
    "Be gentle with yourself today.",
    "You deserve compassion, especially from yourself.",
  ];

  // If Groq is not configured, use fallback prompts
  if (!isAIConfigured()) {
    const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
    return {
      question: fallbackQuestions[randomIndex],
      encouragement: fallbackEncouragements[randomIndex],
      cached: false,
    };
  }

  // Generate new reflection with AI
  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: DAILY_REFLECTION_PROMPT },
        { role: 'user', content: 'Generate today\'s reflection prompt.' },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    let question = "What moment today made you feel most alive?";
    let encouragement = "Your feelings matter, and so do you.";

    try {
      const parsed = JSON.parse(content);
      question = parsed.question || question;
      encouragement = parsed.encouragement || encouragement;
    } catch {
      // Use defaults if parsing fails
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        question = lines[0].replace(/^["\-*]?\s*(question:?\s*)?/i, '');
        encouragement = lines[1].replace(/^["\-*]?\s*(encouragement:?\s*)?/i, '');
      }
    }

    // Cache the reflection
    await prisma.dailyReflection.create({
      data: {
        userId,
        date: today,
        question,
        encouragement,
      },
    });

    return {
      question,
      encouragement,
      cached: false,
    };
  } catch (error) {
    // Use the fallback prompts defined earlier
    const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);

    return {
      question: fallbackQuestions[randomIndex],
      encouragement: fallbackEncouragements[randomIndex],
      cached: false,
    };
  }
};

// ============================================
// Level 4: Weekly Letter Generator
// ============================================

export const generateWeeklyLetterContent = async (analyticsRows: Array<{
  date: string;
  tasksCompleted: number;
  tasksPlanned: number;
  focusMinutesTotal: number;
  dominantMoodOnDay: string | null;
  loadLabel: string;
}>, userName: string | null): Promise<string> => {
  const buildFallback = (rows: typeof analyticsRows, name: string | null) => {
    const totalCompleted = rows.reduce((s, r) => s + r.tasksCompleted, 0);
    const totalFocus = rows.reduce((s, r) => s + r.focusMinutesTotal, 0);
    const focusHours = (totalFocus / 60).toFixed(1);
    return `This week, ${name || 'you'} completed ${totalCompleted} tasks and spent ${focusHours} hours in focused work. Progress like this is quiet but real — it compounds. Be gentle with the days that didn't go as planned; they're part of the rhythm too. Next week, pick one thing you want to feel proud of by Friday. You're building something.`;
  };

  if (!isAIConfigured()) return buildFallback(analyticsRows, userName);

  const summary = analyticsRows.map(r =>
    `${r.date}: ${r.tasksCompleted}/${r.tasksPlanned} tasks, ${r.focusMinutesTotal}m focus, mood: ${r.dominantMoodOnDay || 'unknown'}, load: ${r.loadLabel}`
  ).join('\n');

  const totalCompleted = analyticsRows.reduce((s, r) => s + r.tasksCompleted, 0);
  const totalFocus = analyticsRows.reduce((s, r) => s + r.focusMinutesTotal, 0);

  try {
    const result = await callGroqWithFallback({
      messages: [{
        role: 'user',
        content: `You are a warm, thoughtful productivity coach. Write a personal weekly letter (120–150 words) to ${userName || 'the user'} summarising their week.\n\nWEEK DATA:\n${summary}\n\nTotal tasks completed: ${totalCompleted}\nTotal focus minutes: ${totalFocus}\n\nRules:\n- Speak directly ("you", not "the user")\n- Warm but brief — like a trusted friend\n- 1 genuine observation, 1 gentle suggestion, 1 encouraging close\n- No bullets or headers — flowing prose\n- Start with "This week,"`
      }],
      max_tokens: 250,
      temperature: 0.7,
    });
    return result.choices[0]?.message?.content?.trim() || buildFallback(analyticsRows, userName);
  } catch (error) {
    console.error('Groq API Error (Weekly Letter):', error);
    return buildFallback(analyticsRows, userName);
  }
};

/**
 * NEW: Analyze a specific reflection and provide structured AI response
 */
export const analyzeReflection = async (
  userId: string,
  content: string,
  emotion?: string,
  intensity?: number,
  mcqData?: {
    affectedBy?: string | null;
    energyLevel?: string | null;
    drainedBy?: string[];
    need?: string | null;
  }
): Promise<string> => {
  if (!isAIConfigured()) {
    return "You showed up for yourself today. That's what matters most. Take a deep breath.\n\nInsight: You're building a habit of reflection.\nSuggestion: Try to notice one small thing that goes well tomorrow.";
  }

  try {
    // Fetch last 7 days of moods for pattern detection
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentMoods = await prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: weekAgo } },
      select: { mood: true },
    });

    const moodCounts: Record<string, number> = {};
    recentMoods.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });

    const context = `
Current Entry:
Emotion: ${emotion || 'Not specified'}
Intensity: ${intensity || 'Not specified'}
Affected By: ${mcqData?.affectedBy || 'Not specified'}
Energy Level: ${mcqData?.energyLevel || 'Not specified'}
Drained By: ${mcqData?.drainedBy?.join(', ') || 'Not specified'}
Need Right Now: ${mcqData?.need || 'Not specified'}
Content: ${content}

Recent Patterns (7 days):
${JSON.stringify(moodCounts)}
`;

    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: REFLECTION_ANALYSIS_PROMPT },
        { role: 'user', content: context },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || "You're doing the work of checking in. That's real progress.";
  } catch (error) {
    console.error('Groq API Error (Analyze Reflection):', error);
    return "You're building emotional awareness by writing this. That's a strong step forward.";
  }
};

// ============================================
// Level 4: Low-Completion Reflection Prompt
// ============================================

export const generateReflectionPrompt = async (completionRate: number, mood: string | null): Promise<string> => {
  const fallbacks = [
    "What got in the way today? One honest sentence is enough.",
    "What would tomorrow's version of you want today's version to know?",
    "If you gave today a word, what would it be — and why?",
    "What was one small thing that went right, even on a tough day?",
  ];

  if (!isAIConfigured()) return fallbacks[Math.floor(Math.random() * fallbacks.length)];

  const moodContext = mood ? ` Their mood today was ${mood}.` : '';
  try {
    const result = await callGroqWithFallback({
      messages: [{
        role: 'user',
        content: `A person completed only ${Math.round(completionRate * 100)}% of their planned tasks today.${moodContext} Write one gentle, non-judgmental reflection question (max 25 words). No preamble. Just the question.`
      }],
      max_tokens: 60,
      temperature: 0.8,
    });
    return result.choices[0]?.message?.content?.trim() || fallbacks[0];
  } catch {
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

// ============================================
// Level 4: Task Title Rewriter
// ============================================

const VAGUE_WORDS = ['stuff', 'things', 'email', 'emails', 'deal with', 'handle', 'work on', 'look at', 'check', 'misc', 'other', 'todo', 'tasks'];

export const rewriteTaskTitle = async (rawTitle: string): Promise<string | null> => {
  const lower = rawTitle.toLowerCase();
  const isVague = VAGUE_WORDS.some(w => lower.includes(w)) || rawTitle.length < 8;
  if (!isVague || !isAIConfigured()) return null;

  try {
    const result = await callGroqWithFallback({
      messages: [{
        role: 'user',
        content: `Rewrite this vague task into a specific, actionable one-liner (max 10 words, no quotes): "${rawTitle}"`
      }],
      max_tokens: 30,
      temperature: 0.6,
    });
    const rewritten = result.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
    if (!rewritten || rewritten.length > 80) return null;
    return rewritten;
  } catch {
    return null;
  }
};

// ============================================
// Journal Weekly Reflection (Warm AI)
// ============================================

export const generateJournalWeeklyReflection = async (
  moodSummary: string,
  count: number
): Promise<string> => {
  const fallback = "You've been writing. That's enough.";
  if (!isAIConfigured() || count < 2) return fallback;

  try {
    const result = await callGroqWithFallback({
      messages: [
        {
          role: 'system',
          content: `You are a quiet, empathetic observer. Write a very brief, poetic, and unstructured reflection (2-3 sentences max) about the user's emotional week based on the moods they logged in their journal. The tone should be warm, dark-aesthetic, gentle, and deeply human. No bullet points, no lists, no rigid advice. Just a quiet observation. If the moods are mixed, acknowledge the complexity gently. The user logged ${count} entries. Their mood breakdown was: ${moodSummary}.`
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return result.choices[0]?.message?.content?.trim() || fallback;
  } catch (err) {
    console.error("AI Journal reflection error:", err);
    return fallback;
  }
};
/**
 * Analyze weekly emotions with human-first insights
 */
export const analyzeWeeklyEmotion = async (userId: string) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: { gte: weekAgo },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (moodEntries.length === 0) {
    return {
      dominantMood: null,
      moodShiftTrend: "Steady",
      averageIntensity: 0,
      emotionalInsightMessage: "You haven't logged enough moments this week for a pattern to emerge. How are you feeling today?"
    };
  }

  const moodCounts: Record<string, number> = {};
  let totalIntensity = 0;
  moodEntries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    totalIntensity += e.intensity;
  });

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
  const averageIntensity = totalIntensity / moodEntries.length;

  // Simple trend logic
  const half = Math.floor(moodEntries.length / 2);
  const firstHalf = moodEntries.slice(0, half);
  const secondHalf = moodEntries.slice(half);
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, r) => s + r.intensity, 0) / firstHalf.length : averageIntensity;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, r) => s + r.intensity, 0) / secondHalf.length : averageIntensity;

  let moodShiftTrend = "Steady";
  if (secondAvg > firstAvg + 1.2) moodShiftTrend = "Intensifying";
  else if (secondAvg < firstAvg - 1.2) moodShiftTrend = "Softening";

  // AI Insight
  let aiSummary: Partial<WeeklySummary> = {};
  if (isAIConfigured()) {
    try {
      aiSummary = await generateWeeklySummary(userId);
    } catch {
      aiSummary = {
        supportiveSentences: ["Your week had its own rhythm.", "You're handling it well."],
        insightSentence: "Your energy has been shifting.",
        suggestion: "Rest when you need to."
      };
    }
  }

  // 4. Mood-Task Correlation
  // Find task completion percentage on days with the dominant mood
  let moodTaskCorrelation = null;
  const analytics = await prisma.taskAnalytics.findMany({
    where: {
      userId,
      dominantMoodOnDay: dominantMood,
      date: { gte: weekAgo.toISOString().split('T')[0] }
    },
    select: { tasksCompleted: true, tasksPlanned: true }
  });

  if (analytics.length > 0) {
    const totalPlanned = analytics.reduce((s, r) => s + r.tasksPlanned, 0);
    const totalDone = analytics.reduce((s, r) => s + r.tasksCompleted, 0);
    if (totalPlanned > 0) {
      moodTaskCorrelation = {
        mood: dominantMood,
        completionRate: Math.round((totalDone / totalPlanned) * 100)
      };
    }
  }

  return {
    dominantMood,
    moodShiftTrend,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    supportiveSentences: aiSummary.supportiveSentences || [],
    insightSentence: aiSummary.insightSentence || "Finding your rhythm.",
    suggestion: aiSummary.suggestion || "Take a breath.",
    moodTaskCorrelation,
    entryCount: moodEntries.length
  };
};
